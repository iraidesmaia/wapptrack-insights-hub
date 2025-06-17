
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const payload = await req.json();
    const instanceName = payload.instance;
    const eventType = payload.event;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false
        }
      }
    );

    console.log(`Webhook recebido: Evento '${eventType}' para instância '${instanceName}'`);

    if (eventType === "QRCODE_UPDATED") {
      const qrcodeBase64 = payload.data.qrcode.base64;
      const status = payload.data.status;

      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          qrcode_base64: qrcodeBase64, 
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('instance_name', instanceName);

      if (error) {
        console.error("Erro ao atualizar QR Code no Supabase:", error);
      } else {
        console.log(`QR Code atualizado para instância ${instanceName}`);
      }

    } else if (eventType === "CONNECTION_UPDATE") {
      const connectionState = payload.data.state;
      const phoneConnected = payload.data.phoneConnected || null;
      const userName = payload.data.user ? payload.data.user.name : null;

      const updateData: any = {
        status: connectionState,
        updated_at: new Date().toISOString()
      };

      if (phoneConnected) updateData.phone_number = phoneConnected;
      if (userName) updateData.user_name_wpp = userName;

      const { error } = await supabase
        .from('whatsapp_instances')
        .update(updateData)
        .eq('instance_name', instanceName);

      if (error) {
        console.error("Erro ao atualizar status de conexão no Supabase:", error);
      } else {
        console.log(`Status atualizado para ${connectionState} na instância ${instanceName}`);
      }
      
      // Limpar QR Code quando conectado
      if (connectionState === 'CONNECTED') {
        await supabase
          .from('whatsapp_instances')
          .update({ qrcode_base64: null })
          .eq('instance_name', instanceName);
      }

    } else if (eventType === "MESSAGES_UPSERT") {
      const newMessages = payload.data.messages;
      console.log(`Novas mensagens recebidas para '${instanceName}':`, newMessages);

    } else if (eventType === "SEND_MESSAGE") {
      const messageStatus = payload.data.status;
      const messageId = payload.data.key.id;
      console.log(`Status de envio de mensagem para '${messageId}': ${messageStatus}`);

    } else {
      console.log(`Evento '${eventType}' da Evolution API recebido e não tratado.`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error("Erro ao processar webhook da Evolution API:", error);
    return new Response(JSON.stringify({ 
      error: 'Erro interno no servidor de webhook.' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
