
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('Request method:', req.method);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { user_id } = requestBody;

    if (!user_id) {
      console.error('user_id não fornecido');
      return new Response(JSON.stringify({ 
        error: 'user_id é obrigatório' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Configurações da Evolution API
    const EVOLUTION_API_URL = 'https://evolutionapi.workidigital.tech';
    const EVOLUTION_API_KEY = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia';
    const WEBHOOK_RECEIVER_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;

    console.log('Configurações:', {
      EVOLUTION_API_URL,
      WEBHOOK_RECEIVER_URL,
      SUPABASE_URL: Deno.env.get('SUPABASE_URL')
    });

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
      console.error('Configurações da Evolution API faltando');
      return new Response(JSON.stringify({ 
        error: 'Erro de configuração: Chaves da Evolution API faltando.' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const instanceName = `wpp_instance_${user_id}_${Date.now()}`;

    console.log(`Criando instância ${instanceName} para usuário ${user_id}`);

    // Criar instância na Evolution API
    const evolutionResponse = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
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
      }),
    });

    console.log('Evolution API response status:', evolutionResponse.status);
    
    const evolutionData = await evolutionResponse.json();
    console.log('Evolution API response data:', evolutionData);

    if (evolutionResponse.ok) {
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
        console.error("Erro ao salvar instância no Supabase:", dbError);
        return new Response(JSON.stringify({ 
          error: 'Erro interno ao salvar dados da instância.' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      console.log(`Instância ${instanceName} criada com sucesso`);

      return new Response(JSON.stringify({
        success: true,
        qrcode: evolutionData.qrcode?.base64 || null,
        instanceName: instanceName,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      console.error("Erro da Evolution API ao criar instância:", evolutionData);
      return new Response(JSON.stringify({ 
        error: evolutionData.message || 'Erro ao criar instância na Evolution API.' 
      }), {
        status: evolutionResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error("Erro ao comunicar com a Evolution API:", error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor ao conectar ao WhatsApp: ' + error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
