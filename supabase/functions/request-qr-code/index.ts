
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const { user_id } = await req.json();

    // Configurações da Evolution API
    const EVOLUTION_API_URL = 'https://evolutionapi.workidigital.tech';
    const EVOLUTION_API_KEY = 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia';
    const WEBHOOK_RECEIVER_URL = `${Deno.env.get('SUPABASE_URL')}/functions/v1/webhook-evolution-receiver`;

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
    const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
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

    const data = await response.json();

    if (response.ok) {
      // Salvar instância no banco de dados
      const { error: dbError } = await supabase
        .from('whatsapp_instances')
        .insert({
          user_id: user_id,
          instance_name: instanceName,
          instance_token: data.instance.token,
          status: 'QRCODE_WAITING',
          qrcode_base64: data.qrcode.base64,
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
        qrcode: data.qrcode.base64,
        instanceName: instanceName,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else {
      console.error("Erro da Evolution API ao criar instância:", data);
      return new Response(JSON.stringify({ 
        error: data.message || 'Erro ao criar instância na Evolution API.' 
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  } catch (error) {
    console.error("Erro ao comunicar com a Evolution API:", error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor ao conectar ao WhatsApp.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
