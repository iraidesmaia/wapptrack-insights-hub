
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const body = await req.json();
    console.log('Evolution webhook received:', JSON.stringify(body, null, 2));

    // Extrair dados do webhook da Evolution API
    const { event, instance, data } = body;
    
    if (!event || !data) {
      console.error('Invalid webhook payload:', body);
      return new Response('Invalid payload', { status: 400, headers: corsHeaders });
    }

    // Processar diferentes tipos de eventos
    switch (event) {
      case 'messages.upsert':
        await handleMessageEvent(supabaseClient, data, instance);
        break;
      case 'send.message':
        await handleSendMessageEvent(supabaseClient, data, instance);
        break;
      case 'message.status':
        await handleMessageStatusEvent(supabaseClient, data, instance);
        break;
      default:
        console.log('Event type not handled:', event);
    }

    return new Response('OK', { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

async function handleMessageEvent(supabase: any, data: any, instance: string) {
  try {
    // Processar mensagem recebida - confirma que o lead está ativo
    const messageData = data.messages?.[0] || data;
    const fromPhone = extractPhoneNumber(messageData.key?.remoteJid || messageData.from);
    
    if (fromPhone && messageData.messageType !== 'senderKeyDistributionMessage') {
      console.log('Processing message from:', fromPhone);
      
      // Atualizar lead para status "engaged" se respondeu
      await updateLeadStatus(supabase, fromPhone, 'engaged', {
        evolution_message_id: messageData.key?.id,
        evolution_status: 'replied',
        last_contact_date: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

async function handleSendMessageEvent(supabase: any, data: any, instance: string) {
  try {
    // Mensagem enviada com sucesso - criar lead válido
    const toPhone = extractPhoneNumber(data.key?.remoteJid || data.to);
    const messageId = data.key?.id || data.messageId;
    
    if (toPhone) {
      console.log('Message sent successfully to:', toPhone);
      
      // Procurar lead pendente e criar lead válido
      await createLeadFromPending(supabase, toPhone, {
        evolution_message_id: messageId,
        evolution_status: 'sent'
      });
    }
  } catch (error) {
    console.error('Error handling send message event:', error);
  }
}

async function handleMessageStatusEvent(supabase: any, data: any, instance: string) {
  try {
    // Status da mensagem (entregue, lida, etc.)
    const phone = extractPhoneNumber(data.key?.remoteJid || data.to);
    const status = data.status || data.ack;
    
    if (phone) {
      console.log('Message status update for:', phone, 'Status:', status);
      
      let leadStatus = 'lead';
      let evolutionStatus = 'sent';
      
      switch (status) {
        case 1:
        case 'SENT':
          evolutionStatus = 'sent';
          break;
        case 2:
        case 'DELIVERED':
          evolutionStatus = 'delivered';
          break;
        case 3:
        case 'READ':
          evolutionStatus = 'read';
          break;
        case 'ERROR':
        case 'FAILED':
          leadStatus = 'to_recover';
          evolutionStatus = 'failed';
          break;
      }
      
      await updateLeadStatus(supabase, phone, leadStatus, {
        evolution_status: evolutionStatus,
        last_whatsapp_attempt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error handling message status event:', error);
  }
}

async function createLeadFromPending(supabase: any, phone: string, evolutionData: any) {
  try {
    // Buscar lead pendente
    const { data: pendingLead, error: pendingError } = await supabase
      .from('pending_leads')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (pendingError || !pendingLead) {
      console.warn('No pending lead found for phone:', phone);
      return;
    }

    // Criar lead válido
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        name: pendingLead.name,
        phone: pendingLead.phone,
        campaign: pendingLead.campaign_name || 'Evolution API',
        campaign_id: pendingLead.campaign_id,
        status: 'lead',
        evolution_message_id: evolutionData.evolution_message_id,
        evolution_status: evolutionData.evolution_status,
        whatsapp_delivery_attempts: 1,
        last_whatsapp_attempt: new Date().toISOString()
      });

    if (leadError) {
      console.error('Error creating lead:', leadError);
      return;
    }

    // Marcar lead pendente como confirmado
    await supabase
      .from('pending_leads')
      .update({ status: 'confirmed' })
      .eq('id', pendingLead.id);

    console.log('Lead created successfully for:', phone);

  } catch (error) {
    console.error('Error creating lead from pending:', error);
  }
}

async function updateLeadStatus(supabase: any, phone: string, status: string, updates: any) {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        status,
        ...updates
      })
      .eq('phone', phone);

    if (error) {
      console.error('Error updating lead status:', error);
    } else {
      console.log('Lead status updated for:', phone, 'to:', status);
    }
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
}

function extractPhoneNumber(jid: string): string | null {
  if (!jid) return null;
  
  // Extrair número do JID do WhatsApp (formato: 5511999999999@s.whatsapp.net)
  const match = jid.match(/(\d+)@/);
  return match ? match[1] : null;
}
