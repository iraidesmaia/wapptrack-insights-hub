
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
  console.log('Request URL:', req.url);
  
  if (req.method === 'OPTIONS') {
    console.log('Respondendo a OPTIONS request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    console.log('=== PROCESSANDO REQUEST BODY ===');
    
    // Passo 4: Melhorar tratamento de erro com mensagens mais específicas
    let requestBody;
    
    try {
      const bodyText = await req.text();
      console.log('Request body text recebido:', bodyText);
      console.log('Tamanho do body:', bodyText.length);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('=== ERRO: Body vazio ===');
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Body da requisição está vazio. O user_id é obrigatório.',
          details: 'Nenhum dado foi enviado na requisição'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Request body parsed com sucesso:', requestBody);
      console.log('Tipo do requestBody:', typeof requestBody);
      
    } catch (parseError) {
      console.error('=== ERRO NO PARSE DO JSON ===');
      console.error('Parse error:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'JSON inválido na requisição.',
        details: `Erro de parsing: ${parseError.message}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
    
    const { user_id } = requestBody;
    console.log('user_id extraído:', user_id);
    console.log('Tipo do user_id:', typeof user_id);

    if (!user_id) {
      console.error('=== ERRO: user_id não fornecido ===');
      console.error('RequestBody completo:', requestBody);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'user_id é obrigatório',
        details: 'O campo user_id não foi encontrado na requisição',
        received: requestBody
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('=== CONFIGURAÇÕES DA EVOLUTION API ===');
    
    // Configurações da Evolution API
    const EVOLUTION_API_URL = 'https://evolutionapi.workidigital.tech';
    const EVOLUTION_API_KEY = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia';
    const WEBHOOK_RECEIVER_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;

    console.log('Evolution API URL:', EVOLUTION_API_URL);
    console.log('Webhook URL:', WEBHOOK_RECEIVER_URL);
    console.log('SUPABASE_URL env:', Deno.env.get('SUPABASE_URL'));

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      console.error('=== ERRO: Configurações faltando ===');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Erro de configuração: Chaves da Evolution API faltando.',
        details: 'Configurações internas do servidor não estão disponíveis'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const instanceName = `wpp_instance_${user_id}_${Date.now()}`;
    console.log('=== CRIANDO INSTÂNCIA ===');
    console.log(`Criando instância: ${instanceName} para usuário: ${user_id}`);

    // Passo 5: Preparar payload para Evolution API
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

    // Criar instância na Evolution API
    console.log('=== CHAMANDO EVOLUTION API ===');
    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(evolutionPayload),
    });

    console.log('Evolution API response status:', evolutionResponse.status);
    console.log('Evolution API response headers:', Object.fromEntries(evolutionResponse.headers.entries()));
    
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
        error: 'Erro na resposta da Evolution API: formato inválido',
        details: `Erro de parsing da resposta: ${evolutionParseError.message}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (evolutionResponse.ok && evolutionData) {
      console.log('=== SALVANDO NO SUPABASE ===');
      
      // Salvar instância no banco de dados
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
          error: 'Erro interno ao salvar dados da instância.',
          details: `Erro do banco de dados: ${dbError.message}`
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
        details: `Status HTTP: ${evolutionResponse.status}`,
        evolutionResponse: evolutionData
      }), {
        status: evolutionResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error("=== ERRO GERAL NA FUNÇÃO ===");
    console.error("Error type:", typeof error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Erro interno do servidor',
      details: `Erro geral: ${error.message}`,
      type: typeof error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
