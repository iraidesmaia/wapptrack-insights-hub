
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateInstanceRequest {
  instanceName: string;
  token: string;
  options_Create_instance: {
    webhook: {
      webhookSettings: {
        webhookUrl: string;
        webhookByEvents: boolean;
        webhookEvents: string[];
      }
    }
  }
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

    // Parse and validate request body - expecting n8n format
    let requestPayload: CreateInstanceRequest;
    try {
      requestPayload = await req.json()
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

    // Validate required fields in n8n format
    if (!requestPayload.instanceName) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'instanceName is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!requestPayload.token) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'token is required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!requestPayload.options_Create_instance?.webhook?.webhookSettings?.webhookUrl) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'webhookUrl is required in options_Create_instance.webhook.webhookSettings' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('📋 Request payload:', {
      instanceName: requestPayload.instanceName,
      token: '[REDACTED]',
      webhookUrl: requestPayload.options_Create_instance.webhook.webhookSettings.webhookUrl,
      user_id: user.id
    })

    // Check if instance already exists - fix UUID issue by handling null properly
    const { data: existingInstance, error: checkError } = await supabase
      .from('evolution_auto_instances')
      .select('*')
      .eq('user_id', user.id)
      .eq('instance_name', requestPayload.instanceName)
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

    console.log('🔧 Creating instance in Evolution API with payload:', {
      ...requestPayload,
      token: '[REDACTED]'
    })

    // Call Evolution API with exact n8n payload format
    const createInstanceResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': requestPayload.token
      },
      body: JSON.stringify(requestPayload)
    })

    console.log('📥 Evolution API response status:', createInstanceResponse.status)
    console.log('📥 Evolution API response headers:', Object.fromEntries(createInstanceResponse.headers.entries()))

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
        body: responseText,
        headers: Object.fromEntries(createInstanceResponse.headers.entries())
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

    // Get QR Code
    console.log('🔧 Getting QR Code')
    let qrCodeBase64 = null
    let retries = 0
    const maxRetries = 10

    while (retries < maxRetries && !qrCodeBase64) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log(`🔄 QR Code attempt ${retries + 1}/${maxRetries}`)
      
      const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${requestPayload.instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': requestPayload.token
        }
      })

      console.log('📥 QR Code response status:', qrResponse.status)

      if (qrResponse.ok) {
        const qrData = await qrResponse.json()
        console.log('📱 QR Response received:', {
          hasBase64: !!qrData.base64,
          hasCode: !!qrData.code,
          status: qrData.status,
          fullResponse: qrData
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

    // Save to database - no client_id, just user_id and instance_name
    console.log('💾 Saving to database')
    const instanceData = {
      user_id: user.id,
      client_id: null, // Explicitly set to null to avoid UUID issues
      instance_name: requestPayload.instanceName,
      instance_token: requestPayload.token,
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
