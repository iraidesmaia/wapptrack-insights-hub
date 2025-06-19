
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateInstanceRequest {
  client_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    if (!authHeader) {
      console.error('Missing Authorization header')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Authorization header is required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid authentication token' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ User authenticated:', user.id)

    // Parse and validate request body
    let requestBody: CreateInstanceRequest;
    try {
      requestBody = await req.json()
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Invalid JSON in request body' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { client_id } = requestBody
    console.log('📋 Request data:', { client_id, user_id: user.id })

    // Buscar nome do cliente/projeto
    let clientName = 'default-project'
    let projectData = null

    if (client_id) {
      console.log('🔍 Searching for client:', client_id)
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name, description')
        .eq('id', client_id)
        .eq('user_id', user.id)
        .single()
      
      if (clientError) {
        console.error('❌ Client query error:', clientError)
        return new Response(JSON.stringify({ 
          success: false,
          error: `Failed to fetch client data: ${clientError.message}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      if (!client) {
        console.error('❌ Client not found:', client_id)
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Client not found or you do not have access to it' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      projectData = client
      clientName = client.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      console.log('✅ Client found:', { name: client.name, cleanName: clientName })
    }

    const instanceName = `${clientName}-${user.id.substring(0, 8)}`
    
    console.log('🏗️ Creating Evolution API instance:', instanceName)

    // Verificar se já existe instância para este client_id
    const { data: existingInstance, error: checkError } = await supabase
      .from('evolution_auto_instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', client_id || null)
      .eq('instance_name', instanceName)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error checking existing instance:', checkError)
      return new Response(JSON.stringify({ 
        success: false,
        error: `Database error: ${checkError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (existingInstance && existingInstance.connection_status === 'open') {
      console.log('✅ Instance already exists and is connected')
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Instance already exists and is connected',
        instance: existingInstance
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Configurações da Evolution API
    const evolutionApiUrl = 'https://evolutionapi.workidigital.tech'
    const evolutionToken = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia'
    const webhookUrl = 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook'

    // Validar configurações obrigatórias
    if (!evolutionApiUrl || !evolutionToken || !webhookUrl) {
      console.error('❌ Missing required Evolution API configuration')
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Missing required Evolution API configuration (URL, token, or webhook)' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Criar instância na Evolution API
    console.log('🔧 Step 1: Creating instance in Evolution API')
    const createInstancePayload = {
      instanceName: instanceName,
      token: evolutionToken,
      qrcode: true,
      webhook: webhookUrl,
      webhook_by_events: true,
      events: ['MESSAGES_UPSERT', 'SEND_MESSAGE']
    }

    console.log('📤 Sending request to Evolution API:', {
      url: `${evolutionApiUrl}/instance/create`,
      payload: createInstancePayload
    })

    const createInstanceResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionToken
      },
      body: JSON.stringify(createInstancePayload)
    })

    console.log('📥 Evolution API response status:', createInstanceResponse.status)

    if (!createInstanceResponse.ok) {
      const errorText = await createInstanceResponse.text()
      console.error('❌ Evolution API error response:', {
        status: createInstanceResponse.status,
        statusText: createInstanceResponse.statusText,
        body: errorText
      })

      try {
        const errorJson = JSON.parse(errorText)
        return new Response(JSON.stringify({ 
          success: false,
          error: `Evolution API error: ${errorJson.message || errorText}`,
          details: errorJson
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      } catch {
        return new Response(JSON.stringify({ 
          success: false,
          error: `Evolution API error (${createInstanceResponse.status}): ${errorText}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    const createInstanceData = await createInstanceResponse.json()
    console.log('✅ Instance created successfully:', createInstanceData)

    // 2. Configurar webhook
    console.log('🔧 Step 2: Setting webhook')
    const webhookPayload = {
      url: webhookUrl,
      webhook_by_events: true,
      events: ['MESSAGES_UPSERT', 'SEND_MESSAGE']
    }

    console.log('📤 Setting webhook:', webhookPayload)

    const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionToken
      },
      body: JSON.stringify(webhookPayload)
    })

    console.log('📥 Webhook response status:', webhookResponse.status)

    if (!webhookResponse.ok) {
      const webhookErrorText = await webhookResponse.text()
      console.error('⚠️ Webhook configuration failed:', {
        status: webhookResponse.status,
        body: webhookErrorText
      })
    } else {
      console.log('✅ Webhook configured successfully')
    }

    // 3. Obter QR Code
    console.log('🔧 Step 3: Getting QR Code')
    let qrCodeBase64 = null
    let retries = 0
    const maxRetries = 10

    while (retries < maxRetries && !qrCodeBase64) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      
      console.log(`🔄 QR Code attempt ${retries + 1}/${maxRetries}`)
      
      const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionToken
        }
      })

      console.log('📥 QR Code response status:', qrResponse.status)

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        console.log('📱 QR Response received:', {
          hasBase64: !!qrData.base64,
          hasCode: !!qrData.code,
          status: qrData.status
        })
        
        if (qrData.base64) {
          // Limpar o prefixo data:image se existir
          qrCodeBase64 = qrData.base64.replace(/^data:image\/[a-z]+;base64,/, '')
          console.log('✅ QR Code extracted from base64 field')
        } else if (qrData.code) {
          qrCodeBase64 = qrData.code.replace(/^data:image\/[a-z]+;base64,/, '')
          console.log('✅ QR Code extracted from code field')
        }
      } else {
        const qrErrorText = await qrResponse.text()
        console.log('⚠️ QR Code not ready yet:', qrErrorText)
      }
      
      retries++
    }

    if (!qrCodeBase64) {
      console.log('⚠️ QR Code not generated after maximum retries')
    }

    // 4. Salvar na nossa base de dados
    console.log('💾 Step 4: Saving to database')
    const instanceData = {
      user_id: user.id,
      client_id: client_id || null,
      instance_name: instanceName,
      instance_token: evolutionToken,
      qr_code_base64: qrCodeBase64,
      connection_status: qrCodeBase64 ? 'waiting_scan' : 'pending',
      webhook_configured: webhookResponse.ok,
      updated_at: new Date().toISOString()
    }

    console.log('📤 Saving instance data:', {
      ...instanceData,
      qr_code_base64: qrCodeBase64 ? '[QR_CODE_DATA]' : null
    })

    const { data: savedInstance, error: saveError } = await supabase
      .from('evolution_auto_instances')
      .upsert(instanceData, {
        onConflict: 'user_id,client_id,instance_name'
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Database save error:', saveError)
      return new Response(JSON.stringify({ 
        success: false,
        error: `Failed to save instance data: ${saveError.message}` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Instance automation completed successfully')

    return new Response(JSON.stringify({
      success: true,
      message: 'Evolution API instance created and configured successfully',
      instance: savedInstance,
      qr_code: qrCodeBase64,
      webhook_configured: webhookResponse.ok,
      project_data: projectData
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('💥 Unexpected error in create-evolution-instance:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
