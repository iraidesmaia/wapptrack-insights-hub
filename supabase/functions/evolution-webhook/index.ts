
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, getMessageContent, getContactName } from "./helpers.ts";
import { createPhoneSearchVariations } from "./phoneVariations.ts";
import { processComercialMessage, processClientMessage, handleDirectLead } from "./handlers.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const body = await req.json();
    console.log('Evolution webhook received:', JSON.stringify(body, null, 2));

    if (body.event === 'messages.upsert' && body.data) {
      const message = body.data;
      const remoteJid = message.key?.remoteJid;
      const instanceName = body.instance;
      const isFromMe = message.key?.fromMe;
      
      if (remoteJid) {
        // 🚫 FILTRAR MENSAGENS DE GRUPO (terminam com @g.us)
        if (remoteJid.endsWith('@g.us')) {
          console.log(`🚫 Ignorando mensagem de grupo: ${remoteJid}`);
          return new Response(JSON.stringify({ success: true, message: 'Group message ignored' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          });
        }

        const realPhoneNumber = remoteJid.replace('@s.whatsapp.net', '');
        const messageContent = getMessageContent(message);

        console.log(`📱 Processando mensagem de: ${realPhoneNumber} (instância: ${instanceName})`);

        // Create phone variations and look for matching leads
        const phoneVariations = createPhoneSearchVariations(realPhoneNumber);

        const { data: matchedLeads } = await supabase
          .from('leads')
          .select('*, campaigns!leads_campaign_id_fkey(conversion_keywords, cancellation_keywords)')
          .in('phone', phoneVariations);

        if (matchedLeads && matchedLeads.length > 0) {
          console.log(`✅ Lead existente encontrado para ${realPhoneNumber}`);
          if (isFromMe) {
            await processComercialMessage({
              supabase, message, realPhoneNumber, matchedLeads, messageContent
            });
          } else {
            await processClientMessage({
              supabase, message, realPhoneNumber, matchedLeads, messageContent
            });
          }
        } else {
          // No lead found; direct WhatsApp message
          if (!isFromMe) {
            console.log(`🆕 Novo contato direto de: ${realPhoneNumber} (instância: ${instanceName})`);
            await handleDirectLead({ 
              supabase, 
              message, 
              realPhoneNumber, 
              instanceName 
            });
          } else {
            console.log(`📤 Mensagem enviada por mim para: ${realPhoneNumber} - ignorando`);
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('💥 Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
