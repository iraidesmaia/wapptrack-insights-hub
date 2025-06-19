
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

    // Parse request body to get client_id
    let requestData: CreateInstanceRequest = {};
    try {
      requestData = await req.json()
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      // Se não conseguir fazer parse, continua sem client_id
    }

    console.log('📋 Request data received:', { client_id: requestData.client_id })

    // Generate instance name based on user or client
    let instanceName = `User_${user.id.slice(0, 8)}`;
    
    if (requestData.client_id) {
      // Try to get client name if client_id is provided
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('name')
        .eq('id', requestData.client_id)
        .eq('user_id', user.id)
        .single()

      if (!clientError && client) {
        instanceName = client.name.replace(/[^a-zA-Z0-9]/g, '');
        console.log('📝 Using client name for instance:', instanceName)
      } else {
        console.log('⚠️ Client not found, using default name')
      }
    }

    // Build Evolution API payload exactly like n8n workflow
    const evolutionPayload = {
      instanceName: instanceName,
      token: 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia',
      options_Create_instance: {
        webhook: {
          webhookSettings: {
            webhookUrl: 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook',
            webhookByEvents: true,
            webhookEvents: ['MESSAGES_UPSERT', 'SEND_MESSAGE']
          }
        }
      }
    };

    console.log('🔧 Evolution API payload constructed:', {
      instanceName: evolutionPayload.instanceName,
      token: '[REDACTED]',
      webhookUrl: evolutionPayload.options_Create_instance.webhook.webhookSettings.webhookUrl,
      webhookEvents: evolutionPayload.options_Create_instance.webhook.webhookSettings.webhookEvents
    })

    // Check if instance already exists
    const { data: existingInstance, error: checkError } = await supabase
      .from('evolution_auto_instances')
      .select('*')
      .eq('user_id', user.id)
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

    // Evolution API configuration
    const evolutionApiUrl = 'https://evolutionapi.workidigital.tech'

    console.log('🚀 Creating instance in Evolution API...')

    // Call Evolution API with constructed payload
    const createInstanceResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionPayload.token
      },
      body: JSON.stringify(evolutionPayload)
    })

    console.log('📥 Evolution API response status:', createInstanceResponse.status)

    let createInstanceData;
    let responseText = '';

    try {
      responseText = await createInstanceResponse.text()
      console.log('📥 Evolution API raw response:', responseText)
      
      if (responseText) {
        createInstanceData = JSON.parse(responseText)
        console.log('📥 Evolution API parsed response:', createInstanceData)
      }
    } catch (parseError) {
      console.error('❌ Failed to parse Evolution API response:', parseError)
      console.error('❌ Raw response text:', responseText)
    }

    if (!createInstanceResponse.ok) {
      console.error('❌ Evolution API error response:', {
        status: createInstanceResponse.status,
        statusText: createInstanceResponse.statusText,
        body: responseText
      })

      return new Response(JSON.stringify({ 
        success: false,
        error: `Evolution API error (${createInstanceResponse.status}): ${responseText || createInstanceResponse.statusText}`,
        details: createInstanceData,
        status: createInstanceResponse.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('✅ Instance created successfully:', createInstanceData)

    // Get QR Code with retries
    console.log('🔧 Getting QR Code')
    let qrCodeBase64 = null
    let retries = 0
    const maxRetries = 10

    while (retries < maxRetries && !qrCodeBase64) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`🔄 QR Code attempt ${retries + 1}/${maxRetries}`)
      
      const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionPayload.token
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
          qrCodeBase64 = qrData.base64.replace(/^data:image\/[a-z]+;base64,/, '')
          console.log('✅ QR Code extracted from base64 field')
        } else if (qrData.code) {
          qrCodeBase64 = qrData.code.replace(/^data:image\/[a-z]+;base64,/, '')
          console.log('✅ QR Code extracted from code field')
        }
      } else {
        const qrErrorText = await qrResponse.text()
        console.log('⚠️ QR Code not ready yet:', {
          status: qrResponse.status,
          error: qrErrorText
        })
      }
      
      retries++
    }

    if (!qrCodeBase64) {
      console.log('⚠️ QR Code not generated after maximum retries')
    }

    // Save to database
    console.log('💾 Saving to database')
    const instanceData = {
      user_id: user.id,
      client_id: requestData.client_id || null,
      instance_name: instanceName,
      instance_token: evolutionPayload.token,
      qr_code_base64: qrCodeBase64,
      connection_status: qrCodeBase64 ? 'waiting_scan' : 'pending',
      webhook_configured: true,
      updated_at: new Date().toISOString()
    }

    console.log('📤 Saving instance data:', {
      ...instanceData,
      instance_token: '[REDACTED]',
      qr_code_base64: qrCodeBase64 ? '[QR_CODE_DATA]' : null
    })

    const { data: savedInstance, error: saveError } = await supabase
      .from('evolution_auto_instances')
      .upsert(instanceData, {
        onConflict: 'user_id,instance_name'
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
      webhook_configured: true,
      evolution_response: createInstanceData
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
