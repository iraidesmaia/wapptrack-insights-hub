
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
      
      // Extrair o conteúdo da mensagem
      let messageContent = '';
      
      if (messageData.message) {
        if (messageData.message.conversation) {
          messageContent = messageData.message.conversation;
        } else if (messageData.message.extendedTextMessage?.text) {
          messageContent = messageData.message.extendedTextMessage.text;
        } else if (messageData.messageType === 'imageMessage') {
          messageContent = '[Imagem enviada]';
        } else if (messageData.messageType === 'audioMessage') {
          messageContent = '[Áudio enviado]';
        } else if (messageData.messageType === 'videoMessage') {
          messageContent = '[Vídeo enviado]';
        } else if (messageData.messageType === 'documentMessage') {
          messageContent = '[Documento enviado]';
        } else {
          messageContent = `[${messageData.messageType || 'Mensagem'}]`;
        }
      }
      
      console.log('Message content extracted:', messageContent);
      
      // Atualizar lead para status "lead" se respondeu e salvar a última mensagem
      await updateLeadStatusWithPhoneVariations(supabase, fromPhone, 'lead', {
        evolution_message_id: messageData.key?.id,
        evolution_status: 'replied',
        last_contact_date: new Date().toISOString(),
        last_message: messageContent
      });
    }
  } catch (error) {
    console.error('Error handling message event:', error);
  }
}

async function handleSendMessageEvent(supabase: any, data: any, instance: string) {
  try {
    // Mensagem enviada com sucesso - criar lead válido se for de um pending lead
    // OU atualizar status para "contacted" se você está respondendo a um lead existente
    const toPhone = extractPhoneNumber(data.key?.remoteJid || data.to);
    const messageId = data.key?.id || data.messageId;
    
    if (toPhone) {
      console.log('Message sent successfully to:', toPhone);
      
      // Primeiro, verificar se existe um lead com esse número
      const phoneVariations = createPhoneVariations(toPhone);
      let existingLead = null;
      
      for (const variation of phoneVariations) {
        const { data: leadData, error } = await supabase
          .from('leads')
          .select('*')
          .eq('phone', variation)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!error && leadData) {
          existingLead = leadData;
          console.log('Found existing lead with phone variation:', variation);
          break;
        }
      }

      if (existingLead) {
        // Lead existe - atualizar status para "contacted" se necessário
        const currentStatus = existingLead.status;
        const shouldUpdateToContacted = ['new', 'lead'].includes(currentStatus);
        
        if (shouldUpdateToContacted) {
          console.log(`Updating lead status from ${currentStatus} to contacted for phone:`, toPhone);
          
          const updates: any = {
            status: 'contacted',
            evolution_message_id: messageId,
            evolution_status: 'sent',
            last_contact_date: new Date().toISOString()
          };
          
          // Se for o primeiro contato, definir first_contact_date
          if (!existingLead.first_contact_date) {
            updates.first_contact_date = new Date().toISOString();
          }
          
          await updateLeadStatusWithPhoneVariations(supabase, toPhone, 'contacted', updates);
        } else {
          // Lead já está em status mais avançado, apenas atualizar dados da mensagem
          console.log(`Lead already in advanced status (${currentStatus}), updating message data only`);
          await updateLeadStatusWithPhoneVariations(supabase, toPhone, currentStatus, {
            evolution_message_id: messageId,
            evolution_status: 'sent',
            last_contact_date: new Date().toISOString()
          });
        }
      } else {
        // Lead não existe - procurar lead pendente e criar lead válido
        await createLeadFromPendingWithPhoneVariations(supabase, toPhone, {
          evolution_message_id: messageId,
          evolution_status: 'sent'
        });
      }
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
          evolutionStatus = 'failed';
          break;
      }
      
      // Não alterar o status do lead, apenas atualizar o evolution_status
      await updateLeadEvolutionStatusWithPhoneVariations(supabase, phone, evolutionStatus);
    }
  } catch (error) {
    console.error('Error handling message status event:', error);
  }
}

async function createLeadFromPendingWithPhoneVariations(supabase: any, phone: string, evolutionData: any) {
  try {
    const phoneVariations = createPhoneVariations(phone);
    console.log('Searching for pending lead with phone variations:', phoneVariations);
    
    let pendingLead = null;
    
    // Tentar encontrar lead pendente usando variações do número
    for (const variation of phoneVariations) {
      const { data, error } = await supabase
        .from('pending_leads')
        .select('*')
        .eq('phone', variation)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        pendingLead = data;
        console.log('Found pending lead with phone variation:', variation);
        break;
      }
    }

    if (!pendingLead) {
      console.warn('No pending lead found for phone variations:', phoneVariations);
      return;
    }

    // Criar lead válido com status "lead" (será atualizado para "contacted" em seguida)
    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        name: pendingLead.name,
        phone: pendingLead.phone,
        campaign: pendingLead.campaign_name || 'Evolution API',
        campaign_id: pendingLead.campaign_id,
        status: 'contacted', // Já criar como "contacted" pois a mensagem foi enviada
        evolution_message_id: evolutionData.evolution_message_id,
        evolution_status: evolutionData.evolution_status,
        whatsapp_delivery_attempts: 1,
        last_whatsapp_attempt: new Date().toISOString(),
        first_contact_date: new Date().toISOString(), // Primeiro contato
        last_contact_date: new Date().toISOString()
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

    console.log('Lead created successfully with status "contacted" for:', phone);

  } catch (error) {
    console.error('Error creating lead from pending:', error);
  }
}

async function updateLeadStatusWithPhoneVariations(supabase: any, phone: string, status: string, updates: any) {
  try {
    const phoneVariations = createPhoneVariations(phone);
    console.log('Updating lead status for phone variations:', phoneVariations, 'to:', status);
    
    let updated = false;
    
    // Tentar atualizar usando variações do número
    for (const variation of phoneVariations) {
      const { data, error } = await supabase
        .from('leads')
        .update({
          status,
          ...updates
        })
        .eq('phone', variation);

      if (!error && data) {
        console.log('Lead status updated for variation:', variation, 'to:', status);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      console.warn('No lead found for phone variations:', phoneVariations);
    }
  } catch (error) {
    console.error('Error updating lead status:', error);
  }
}

async function updateLeadEvolutionStatusWithPhoneVariations(supabase: any, phone: string, evolutionStatus: string) {
  try {
    const phoneVariations = createPhoneVariations(phone);
    console.log('Updating evolution status for phone variations:', phoneVariations, 'to:', evolutionStatus);
    
    let updated = false;
    
    // Tentar atualizar usando variações do número
    for (const variation of phoneVariations) {
      const { data, error } = await supabase
        .from('leads')
        .update({
          evolution_status: evolutionStatus,
          last_whatsapp_attempt: new Date().toISOString()
        })
        .eq('phone', variation);

      if (!error && data) {
        console.log('Lead evolution status updated for variation:', variation, 'to:', evolutionStatus);
        updated = true;
        break;
      }
    }
    
    if (!updated) {
      console.warn('No lead found for phone variations:', phoneVariations);
    }
  } catch (error) {
    console.error('Error updating lead evolution status:', error);
  }
}

function createPhoneVariations(phone: string): string[] {
  const digits = phone.replace(/\D/g, '');
  const variations: string[] = [digits];
  
  if (digits.startsWith('55')) {
    // Remove country code
    const withoutCountryCode = digits.slice(2);
    variations.push(withoutCountryCode);
    
    // If it's 11 digits (DDD + 9 digits), also try without the first 9
    if (withoutCountryCode.length === 11) {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(3); // Remove the 9
      variations.push(ddd + number);
      variations.push('55' + ddd + number);
    }
    
    // If it's 10 digits (DDD + 8 digits), also try with a 9 added
    if (withoutCountryCode.length === 10) {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(2);
      variations.push(ddd + '9' + number);
      variations.push('55' + ddd + '9' + number);
    }
  } else {
    // Add country code
    variations.push('55' + digits);
    
    // If it's 10 digits (DDD + 8 digits), also try with a 9 added
    if (digits.length === 10) {
      const ddd = digits.slice(0, 2);
      const number = digits.slice(2);
      variations.push(ddd + '9' + number);
      variations.push('55' + ddd + '9' + number);
    }
    
    // If it's 11 digits (DDD + 9 digits), also try without the first 9
    if (digits.length === 11) {
      const ddd = digits.slice(0, 2);
      const number = digits.slice(3); // Remove the 9
      variations.push(ddd + number);
      variations.push('55' + ddd + number);
    }
  }
  
  // Remove duplicates
  return [...new Set(variations)];
}

function extractPhoneNumber(jid: string): string | null {
  if (!jid) return null;
  
  // Extrair número do JID do WhatsApp (formato: 5511999999999@s.whatsapp.net)
  const match = jid.match(/(\d+)@/);
  return match ? match[1] : null;
}
