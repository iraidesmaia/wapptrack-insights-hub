
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== NOVA REQUISIÇÃO EDGE FUNCTION ===');
  console.log('Method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Processar body da requisição
    const requestBody = await req.json();
    const { user_id } = requestBody;

    console.log('User ID recebido:', user_id);

    if (!user_id) {
      console.error('user_id não fornecido');
      return new Response(JSON.stringify({ 
        success: false,
        error: 'user_id é obrigatório' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Configurações da Evolution API
    const EVOLUTION_API_URL = 'https://evolutionapi.workidigital.tech';
    const EVOLUTION_API_KEY = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia';
    const WEBHOOK_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;

    console.log('=== CONFIGURAÇÕES ===');
    console.log('Evolution URL:', EVOLUTION_API_URL);
    console.log('Webhook URL:', WEBHOOK_URL);

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Configurações da Evolution API não disponíveis' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const instanceName = `wpp_${user_id.slice(-8)}_${Date.now()}`;
    console.log('Nome da instância:', instanceName);

    // Payload para Evolution API
    const evolutionPayload = {
      instanceName: instanceName,
      qrcode: true,
      webhook: {
        url: WEBHOOK_URL,
        enabled: true,
        events: [
          "QRCODE_UPDATED",
          "CONNECTION_UPDATE",
          "MESSAGES_UPSERT"
        ]
      }
    };

    console.log('=== CHAMANDO EVOLUTION API ===');
    console.log('Payload:', JSON.stringify(evolutionPayload, null, 2));

    // Chamar Evolution API
    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify(evolutionPayload),
    });

    console.log('Status da resposta:', evolutionResponse.status);
    
    const responseText = await evolutionResponse.text();
    console.log('Resposta raw:', responseText);

    let evolutionData;
    try {
      evolutionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Resposta inválida da Evolution API',
        details: responseText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Dados parsed:', evolutionData);

    // Verificar se houve erro na Evolution API
    if (!evolutionResponse.ok) {
      console.error('=== ERRO DA EVOLUTION API ===');
      console.error('Status:', evolutionResponse.status);
      console.error('Data:', evolutionData);

      // Tratamento específico para erro "Invalid integration"
      if (evolutionData?.response?.message?.includes('Invalid integration')) {
        return new Response(JSON.stringify({ 
          success: false,
          error: 'Configuração da Evolution API inválida. Verifique as credenciais.',
          details: 'A chave da API ou URL podem estar incorretas.'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      return new Response(JSON.stringify({ 
        success: false,
        error: evolutionData?.error || 'Erro na Evolution API',
        details: evolutionData?.response?.message || `Status: ${evolutionResponse.status}`
      }), {
        status: evolutionResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Sucesso - salvar no Supabase
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
      console.error('Erro ao salvar no Supabase:', dbError);
      return new Response(JSON.stringify({ 
        success: false,
        error: 'Erro ao salvar instância no banco',
        details: dbError.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('=== SUCESSO COMPLETO ===');
    return new Response(JSON.stringify({
      success: true,
      qrcode: evolutionData.qrcode?.base64 || null,
      instanceName: instanceName,
      message: 'Instância criada com sucesso'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error("=== ERRO GERAL ===");
    console.error('Erro:', error);
    
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
