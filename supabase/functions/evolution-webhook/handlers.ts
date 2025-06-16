
// Handler functions for the evolution-webhook edge function
import { detectKeywords, getMessageContent, getContactName } from "./helpers.ts";

export async function processComercialMessage(args: any): Promise<void> {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent } = args;
  
  console.log('📤 processComercialMessage - Mensagem comercial enviada para:', realPhoneNumber);
  console.log('📤 Conteúdo da mensagem:', messageContent);
  
  try {
    // Atualizar tentativas de entrega para todos os leads correspondentes
    for (const lead of matchedLeads) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          whatsapp_delivery_attempts: (lead.whatsapp_delivery_attempts || 0) + 1,
          last_whatsapp_attempt: new Date().toISOString(),
          last_contact_date: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar tentativas de entrega:', updateError);
      } else {
        console.log('✅ Tentativas de entrega atualizadas para lead:', lead.name);
      }
    }
  } catch (error) {
    console.error('❌ Erro no processComercialMessage:', error);
  }
}

export async function processClientMessage(args: any): Promise<void> {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent } = args;
  
  console.log('📥 processClientMessage - Mensagem recebida de:', realPhoneNumber);
  console.log('📥 Conteúdo da mensagem:', messageContent);
  console.log('📥 Leads correspondentes:', matchedLeads.length);
  
  try {
    // Processar cada lead correspondente
    for (const lead of matchedLeads) {
      console.log('🔍 Processando lead:', lead.name, '- Status atual:', lead.status);
      
      // Salvar a última mensagem no lead
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_message: messageContent,
          last_contact_date: new Date().toISOString(),
          evolution_message_id: message.key?.id || null,
          evolution_status: message.status || null
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar mensagem do lead:', updateError);
        continue;
      }

      console.log('✅ Mensagem salva para lead:', lead.name);

      // Verificar palavras-chave de conversão
      const conversionKeywords = lead.campaigns?.conversion_keywords || [];
      const cancellationKeywords = lead.campaigns?.cancellation_keywords || [];
      
      console.log('🔑 Palavras de conversão:', conversionKeywords);
      console.log('🔑 Palavras de cancelamento:', cancellationKeywords);

      let newStatus = lead.status;
      
      // Verificar se contém palavras de conversão
      if (conversionKeywords.length > 0 && detectKeywords(messageContent, conversionKeywords)) {
        console.log('🎯 Palavras de conversão detectadas!');
        newStatus = 'converted';
        
        // Criar venda automaticamente
        try {
          const { error: saleError } = await supabase
            .from('sales')
            .insert({
              value: 0, // Valor padrão, pode ser atualizado posteriormente
              date: new Date().toISOString(),
              lead_id: lead.id,
              lead_name: lead.name,
              campaign: lead.campaign,
              product: '',
              notes: `Venda criada automaticamente pela detecção de palavra-chave: "${messageContent.substring(0, 100)}"`
            });

          if (saleError) {
            console.error('❌ Erro ao criar venda automática:', saleError);
          } else {
            console.log('💰 Venda criada automaticamente para:', lead.name);
          }
        } catch (saleCreationError) {
          console.error('❌ Erro na criação de venda:', saleCreationError);
        }
      }
      // Verificar se contém palavras de cancelamento
      else if (cancellationKeywords.length > 0 && detectKeywords(messageContent, cancellationKeywords)) {
        console.log('❌ Palavras de cancelamento detectadas!');
        newStatus = 'cancelled';
      }
      // ⭐️ NOVA LÓGICA: Se status for 'new' (formulário), atualizar para 'lead'
      else if (lead.status === 'new') {
        console.log('📝 Lead de formulário enviou primeira mensagem, atualizando para LEAD');
        newStatus = 'lead';
      }

      // Atualizar status se necessário
      if (newStatus !== lead.status) {
        const { error: statusError } = await supabase
          .from('leads')
          .update({
            status: newStatus,
            last_contact_date: new Date().toISOString()
          })
          .eq('id', lead.id);

        if (statusError) {
          console.error('❌ Erro ao atualizar status do lead:', statusError);
        } else {
          console.log(`✅ Status do lead ${lead.name} atualizado: ${lead.status} → ${newStatus}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro no processClientMessage:', error);
  }
}

export async function handleDirectLead(args: any): Promise<void> {
  const { supabase, message, realPhoneNumber } = args;
  
  console.log('🆕 handleDirectLead - Novo contato direto de:', realPhoneNumber);
  
  // Não processar mensagens de grupo
  if (realPhoneNumber.includes('@g.us')) {
    console.log('👥 Mensagem de grupo ignorada:', realPhoneNumber);
    return;
  }
  
  try {
    const messageContent = getMessageContent(message);
    const contactName = getContactName(message);
    
    console.log('📝 Nome do contato:', contactName);
    console.log('📝 Mensagem:', messageContent);
    
    // ⭐️ NOVA LÓGICA: Primeiro verificar se existe pending_lead para converter
    const { data: pendingLeads, error: pendingError } = await supabase
      .from('pending_leads')
      .select('*')
      .eq('phone', realPhoneNumber)
      .eq('status', 'pending');

    if (pendingError) {
      console.error('❌ Erro ao buscar pending_leads:', pendingError);
    } else if (pendingLeads && pendingLeads.length > 0) {
      console.log('🔄 Convertendo pending_lead para lead definitivo:', pendingLeads[0]);
      
      const pendingLead = pendingLeads[0];
      
      // Criar lead definitivo com status 'lead'
      const { data: newLead, error: createError } = await supabase
        .from('leads')
        .insert({
          name: pendingLead.name,
          phone: pendingLead.phone,
          campaign: pendingLead.campaign_name || 'WhatsApp Direto',
          campaign_id: pendingLead.campaign_id,
          status: 'lead', // ⭐️ Status direto como 'lead'
          last_message: messageContent,
          first_contact_date: new Date().toISOString(),
          last_contact_date: new Date().toISOString(),
          evolution_message_id: message.key?.id || null,
          evolution_status: message.status || null,
          notes: `Lead convertido de pending_lead`,
          utm_source: pendingLead.utm_source,
          utm_medium: pendingLead.utm_medium,
          utm_campaign: pendingLead.utm_campaign,
          utm_content: pendingLead.utm_content,
          utm_term: pendingLead.utm_term
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar lead definitivo:', createError);
      } else {
        console.log('✅ Lead definitivo criado:', newLead.name);
        
        // Deletar pending_lead
        const { error: deleteError } = await supabase
          .from('pending_leads')
          .delete()
          .eq('id', pendingLead.id);

        if (deleteError) {
          console.error('❌ Erro ao deletar pending_lead:', deleteError);
        } else {
          console.log('🗑️ Pending_lead removido com sucesso');
        }
      }
      return;
    }
    
    // Verificar se já existe um lead com esse telefone
    const { data: existingLeads, error: searchError } = await supabase
      .from('leads')
      .select('id, name, status')
      .eq('phone', realPhoneNumber)
      .limit(1);

    if (searchError) {
      console.error('❌ Erro ao buscar leads existentes:', searchError);
      return;
    }

    if (existingLeads && existingLeads.length > 0) {
      console.log('📞 Lead já existe, atualizando mensagem:', existingLeads[0].name);
      
      // Atualizar a última mensagem do lead existente
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_message: messageContent,
          last_contact_date: new Date().toISOString(),
          evolution_message_id: message.key?.id || null,
          evolution_status: message.status || null
        })
        .eq('id', existingLeads[0].id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead existente:', updateError);
      } else {
        console.log('✅ Lead existente atualizado com nova mensagem');
      }
      return;
    }

    // ⭐️ MODIFICAÇÃO: Criar novo lead direto com status 'lead' (não 'new')
    const newLead = {
      name: contactName,
      phone: realPhoneNumber,
      campaign: 'WhatsApp Direto',
      status: 'lead', // ⭐️ Status direto como 'lead'
      last_message: messageContent,
      first_contact_date: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
      evolution_message_id: message.key?.id || null,
      evolution_status: message.status || null,
      notes: `Lead criado automaticamente via WhatsApp direto`,
      utm_source: 'whatsapp',
      utm_medium: 'direct',
      utm_campaign: 'organic'
    };

    console.log('🆕 Criando novo lead direto com status LEAD:', newLead);

    const { data: createdLead, error: insertError } = await supabase
      .from('leads')
      .insert(newLead)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao criar novo lead direto:', insertError);
    } else {
      console.log('✅ Novo lead direto criado com sucesso:', createdLead.name);
    }
  } catch (error) {
    console.error('❌ Erro no handleDirectLead:', error);
  }
}
