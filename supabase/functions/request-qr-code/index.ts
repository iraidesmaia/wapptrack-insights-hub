
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== INÍCIO DA EDGE FUNCTION ===');
  console.log('Request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== PROCESSANDO REQUEST BODY ===');
    
    let requestBody;
    try {
      const bodyText = await req.text();
      console.log('Request body text recebido:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('=== ERRO: Body vazio ===');
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Body da requisição está vazio. O user_id é obrigatório.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Request body parsed com sucesso:', requestBody);
      
    } catch (parseError) {
      console.error('=== ERRO NO PARSE DO JSON ===');
      console.error('Parse error:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'JSON inválido na requisição.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const { user_id } = requestBody;
    console.log('user_id extraído:', user_id);

    if (!user_id) {
      console.error('=== ERRO: user_id não fornecido ===');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'user_id é obrigatório'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('=== INICIALIZANDO SUPABASE CLIENT ===');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    console.log('=== BUSCANDO CREDENCIAIS DO USUÁRIO ===');
    const { data: credentials, error: credentialsError } = await supabase
      .from('evolution_credentials')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (credentialsError) {
      console.error('Erro ao buscar credenciais:', credentialsError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Erro ao buscar credenciais do usuário'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!credentials) {
      console.error('=== ERRO: Credenciais não configuradas ===');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Credenciais da Evolution API não configuradas. Configure primeiro nas configurações.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (credentials.status !== 'valid') {
      console.error('=== ERRO: Credenciais inválidas ===');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Credenciais da Evolution API são inválidas. Valide nas configurações.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('=== USANDO CREDENCIAIS DO USUÁRIO ===');
    console.log('Evolution API URL:', credentials.api_url);
    
    const WEBHOOK_RECEIVER_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;
    console.log('Webhook URL:', WEBHOOK_RECEIVER_URL);

    const instanceName = credentials.instance_name || `wpp_instance_${user_id}_${Date.now()}`;
    console.log('=== CRIANDO INSTÂNCIA ===');
    console.log(`Criando instância: ${instanceName} para usuário: ${user_id}`);

    const evolutionPayload = {
      instanceName: instanceName,
      qrcode: true,
      webhook: {
        url: WEBHOOK_RECEIVER_URL,
        enabled: true,
        events: [
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT",
          "SEND_MESSAGE",
        ]
      }
    };

    console.log('Payload para Evolution API:', evolutionPayload);

    console.log('=== CHAMANDO EVOLUTION API ===');
    const evolutionResponse = await fetch(`${credentials.api_url}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': credentials.api_key,
      },
      body: JSON.stringify(evolutionPayload),
    });

    console.log('Evolution API response status:', evolutionResponse.status);
    
    let evolutionData;
    try {
      const responseText = await evolutionResponse.text();
      console.log('Evolution API response text:', responseText);
      
      if (responseText) {
        evolutionData = JSON.parse(responseText);
        console.log('Evolution API response data:', evolutionData);
      } else {
        console.error('Evolution API retornou resposta vazia');
        evolutionData = null;
      }
    } catch (evolutionParseError) {
      console.error('=== ERRO NO PARSE DA RESPOSTA DA EVOLUTION API ===');
      console.error('Parse error:', evolutionParseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Erro na resposta da Evolution API: formato inválido'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (evolutionResponse.ok && evolutionData) {
      console.log('=== SALVANDO NO SUPABASE ===');
      
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          user_id: user_id,
          instance_name: instanceName,
          instance_token: evolutionData.instance?.token || null,
          status: 'QRCODE_WAITING',
          qrcode_base64: evolutionData.qrcode?.base64 || null,
        });

      if (dbError) {
        console.error("=== ERRO AO SALVAR NO SUPABASE ===");
        console.error("Supabase error:", dbError);
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Erro interno ao salvar dados da instância.'
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      console.log('=== SUCESSO ===');
      console.log(`Instância ${instanceName} criada e salva com sucesso`);

      return new Response(JSON.stringify({
        success: true,
        qrcode: evolutionData.qrcode?.base64 || null,
        instanceName: instanceName,
        message: 'Instância criada com sucesso'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      console.error("=== ERRO DA EVOLUTION API ===");
      console.error("Evolution API error:", evolutionData);
      console.error("Response status:", evolutionResponse.status);
      
      return new Response(JSON.stringify({ 
        success: false,
        error: evolutionData?.message || 'Erro ao criar instância na Evolution API.',
        details: `Status HTTP: ${evolutionResponse.status}`
      }), {
        status: evolutionResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error("=== ERRO GERAL NA FUNÇÃO ===");
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
