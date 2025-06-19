
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
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { client_id }: CreateInstanceRequest = await req.json()

    // Buscar nome do cliente/projeto
    let clientName = 'default-project'
    if (client_id) {
      const { data: client } = await supabase
        .from('clients')
        .select('name')
        .eq('id', client_id)
        .eq('user_id', user.id)
        .single()
      
      if (client) {
        clientName = client.name.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
      }
    }

    const instanceName = `${clientName}-${user.id.substring(0, 8)}`
    
    console.log('Creating Evolution API instance:', instanceName)

    // Verificar se já existe instância para este client_id
    const { data: existingInstance } = await supabase
      .from('evolution_auto_instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('client_id', client_id || null)
      .eq('instance_name', instanceName)
      .single()

    if (existingInstance && existingInstance.connection_status === 'open') {
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

    // 1. Criar instância na Evolution API
    console.log('Step 1: Creating instance in Evolution API')
    const createInstanceResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionToken
      },
      body: JSON.stringify({
        instanceName: instanceName,
        token: evolutionToken,
        qrcode: true,
        number: false,
        webhook: webhookUrl,
        webhook_by_events: false,
        events: ['MESSAGES_UPSERT', 'SEND_MESSAGE']
      })
    })

    if (!createInstanceResponse.ok) {
      const errorText = await createInstanceResponse.text()
      console.error('Error creating instance:', errorText)
      throw new Error(`Failed to create instance: ${createInstanceResponse.status}`)
    }

    const createInstanceData = await createInstanceResponse.json()
    console.log('Instance created:', createInstanceData)

    // 2. Configurar webhook
    console.log('Step 2: Setting webhook')
    const webhookResponse = await fetch(`${evolutionApiUrl}/webhook/set/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionToken
      },
      body: JSON.stringify({
        url: webhookUrl,
        webhook_by_events: true,
        events: ['MESSAGES_UPSERT', 'SEND_MESSAGE']
      })
    })

    if (!webhookResponse.ok) {
      console.error('Error setting webhook:', await webhookResponse.text())
    }

    // 3. Obter QR Code
    console.log('Step 3: Getting QR Code')
    let qrCodeBase64 = null
    let retries = 0
    const maxRetries = 10

    while (retries < maxRetries && !qrCodeBase64) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      
      const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': evolutionToken
        }
      })

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        console.log('QR Response:', qrData)
        
        if (qrData.base64) {
          // Limpar o prefixo data:image se existir
          qrCodeBase64 = qrData.base64.replace(/^data:image\/[a-z]+;base64,/, '')
        } else if (qrData.code) {
          qrCodeBase64 = qrData.code.replace(/^data:image\/[a-z]+;base64,/, '')
        }
      }
      
      retries++
    }

    // 4. Salvar na nossa base de dados
    const { data: savedInstance, error: saveError } = await supabase
      .from('evolution_auto_instances')
      .upsert({
        user_id: user.id,
        client_id: client_id || null,
        instance_name: instanceName,
        instance_token: evolutionToken,
        qr_code_base64: qrCodeBase64,
        connection_status: qrCodeBase64 ? 'waiting_scan' : 'pending',
        webhook_configured: webhookResponse.ok,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,client_id,instance_name'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving instance:', saveError)
      throw new Error('Failed to save instance data')
    }

    console.log('Instance automation completed successfully')

    return new Response(JSON.stringify({
      success: true,
      message: 'Evolution API instance created and configured successfully',
      instance: savedInstance,
      qr_code: qrCodeBase64,
      webhook_configured: webhookResponse.ok
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in create-evolution-instance:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
