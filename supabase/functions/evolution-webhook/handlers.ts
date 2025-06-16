import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

interface WebhookData {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    status: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
  };
}

// ✅ FUNÇÃO ATUALIZADA PARA PROCESSAR MENSAGENS DE CLIENTE (SEM ATUALIZAR last_message)
export const processClientMessage = async (params: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  matchedLeads: any[];
  messageContent: string;
}) => {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent } = params;
  
  console.log(`📱 Processing client message from: ${realPhoneNumber}`);
  
  // Primeiro, tentar conversão de pending_lead (fluxo formulário)
  await handlePendingLeadConversion(
    supabase,
    realPhoneNumber,
    messageContent,
    message.key?.id || '',
    message.status || 'received',
    message.pushName
  );
  
  // Atualizar leads existentes APENAS com data de contato (preservar primeira mensagem)
  for (const lead of matchedLeads) {
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_contact_date: new Date().toISOString(),
          evolution_message_id: message.key?.id,
          evolution_status: message.status,
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`❌ Error updating lead ${lead.id}:`, updateError);
      } else {
        console.log(`✅ Updated lead ${lead.id} contact date (preserving first message)`);
      }
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error);
    }
  }
};

// ✅ FUNÇÃO ATUALIZADA PARA PROCESSAR MENSAGENS COMERCIAIS (SEM ATUALIZAR last_message)
export const processComercialMessage = async (params: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  matchedLeads: any[];
  messageContent: string;
}) => {
  const { supabase, message, realPhoneNumber, matchedLeads, messageContent } = params;
  
  console.log(`💼 Processing commercial message to: ${realPhoneNumber}`);
  
  // Verificar palavras-chave de conversão e cancelamento
  for (const lead of matchedLeads) {
    const campaign = lead.campaigns;
    let newStatus = lead.status;
    
    if (campaign?.conversion_keywords) {
      const hasConversionKeyword = campaign.conversion_keywords.some((keyword: string) =>
        messageContent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasConversionKeyword) {
        newStatus = 'converted';
        console.log(`🎉 Conversion detected for lead ${lead.id}`);
      }
    }
    
    if (campaign?.cancellation_keywords) {
      const hasCancellationKeyword = campaign.cancellation_keywords.some((keyword: string) =>
        messageContent.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasCancellationKeyword) {
        newStatus = 'cancelled';
        console.log(`❌ Cancellation detected for lead ${lead.id}`);
      }
    }
    
    // Atualizar lead APENAS com data de contato e status (preservar primeira mensagem)
    try {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_contact_date: new Date().toISOString(),
          evolution_message_id: message.key?.id,
          evolution_status: message.status,
          status: newStatus,
        })
        .eq('id', lead.id);

      if (updateError) {
        console.error(`❌ Error updating lead ${lead.id}:`, updateError);
      } else {
        console.log(`✅ Updated lead ${lead.id} with status: ${newStatus} (preserving first message)`);
      }
    } catch (error) {
      console.error(`❌ Error processing lead ${lead.id}:`, error);
    }
  }
};

export const handlePendingLeadConversion = async (supabase: any, phone: string, messageText: string, messageId: string, status: string, contactName?: string) => {
  console.log(`🔄 handlePendingLeadConversion - Verificando pending_lead para: ${phone}`);
  
  try {
    // Buscar pending_lead para este telefone
    const { data: pendingLeads, error: pendingError } = await supabase
      .from('pending_leads')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1);

    if (pendingError) {
      console.error('❌ Erro ao buscar pending_leads:', pendingError);
      return;
    }

    if (!pendingLeads || pendingLeads.length === 0) {
      console.log('❌ Nenhum pending_lead encontrado para:', phone);
      return;
    }

    const pendingLead = pendingLeads[0];
    console.log('✅ Pending lead encontrado:', {
      id: pendingLead.id,
      name: pendingLead.name,
      campaign_name: pendingLead.campaign_name,
      utms: {
        utm_source: pendingLead.utm_source,
        utm_medium: pendingLead.utm_medium,
        utm_campaign: pendingLead.utm_campaign,
        utm_content: pendingLead.utm_content,
        utm_term: pendingLead.utm_term
      }
    });

    // 🔒 PRESERVAR SEMPRE O NOME DO FORMULÁRIO (pending_lead.name)
    const finalName = (pendingLead.name && pendingLead.name !== 'Visitante') 
      ? pendingLead.name 
      : (contactName || 'Lead via WhatsApp');

    console.log('🔒 Nome que será usado no lead final (preservando formulário):', {
      nomePendingLead: pendingLead.name,
      nomeContato: contactName,
      nomeFinal: finalName
    });

    // Verificar se já existe um lead para este telefone
    const { data: existingLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', phone)
      .limit(1);

    if (leadCheckError) {
      console.error('❌ Erro ao verificar lead existente:', leadCheckError);
      return;
    }

    if (existingLead && existingLead.length > 0) {
      console.log('📝 Lead existente encontrado, verificando se deve atualizar primeira mensagem...');
      
      // 🎯 SALVAR PRIMEIRA MENSAGEM APENAS SE NÃO EXISTIR
      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: messageId,
        evolution_status: status,
      };
      
      // Verificar se já tem mensagem salva
      if (!existingLead[0].last_message || existingLead[0].last_message.trim() === '') {
        updateData.last_message = messageText;
        console.log('📝 Salvando primeira mensagem do lead existente:', messageText);
      } else {
        console.log('📝 Lead já tem primeira mensagem, preservando:', existingLead[0].last_message);
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead[0].id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead existente:', updateError);
      } else {
        console.log('✅ Lead existente atualizado, primeira mensagem preservada:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          primeiraMensagem: updateData.last_message || existingLead[0].last_message
        });
      }
    } else {
      console.log('🆕 Criando novo lead a partir do pending_lead com primeira mensagem...');
      
      // Criar novo lead com os dados do pending_lead e primeira mensagem
      const newLeadData = {
        name: finalName, // 🔒 Nome do formulário preservado
        phone: phone,
        campaign: pendingLead.campaign_name || 'WhatsApp',
        campaign_id: pendingLead.campaign_id,
        status: 'lead',
        last_message: messageText, // 🎯 PRIMEIRA MENSAGEM SALVA
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString(),
        evolution_message_id: messageId,
        evolution_status: status,
        notes: 'Lead criado automaticamente via WhatsApp a partir de formulário',
        // 🎯 TRANSFERIR UTMs do pending_lead para o lead final
        utm_source: pendingLead.utm_source,
        utm_medium: pendingLead.utm_medium,
        utm_campaign: pendingLead.utm_campaign,
        utm_content: pendingLead.utm_content,
        utm_term: pendingLead.utm_term
      };

      console.log('💾 Dados do novo lead (com primeira mensagem e UTMs do pending_lead):', newLeadData);

      const { error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData);

      if (insertError) {
        console.error('❌ Erro ao criar novo lead:', insertError);
      } else {
        console.log('✅ Novo lead criado com primeira mensagem preservada!');
      }
    }

    // Marcar pending_lead como processado
    const { error: updatePendingError } = await supabase
      .from('pending_leads')
      .update({ status: 'converted' })
      .eq('id', pendingLead.id);

    if (updatePendingError) {
      console.error('❌ Erro ao marcar pending_lead como convertido:', updatePendingError);
    } else {
      console.log('✅ Pending lead marcado como convertido');
    }

  } catch (error) {
    console.error('❌ Erro geral em handlePendingLeadConversion:', error);
  }
};

// ✅ NOVA FUNÇÃO PARA BUSCAR UTMs DE CLICKS DIRETOS
const getUtmsFromDirectClick = async (supabase: any, phone: string): Promise<{
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
} | null> => {
  try {
    // Buscar UTMs salvos nos últimos 30 minutos para este telefone
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data: clickData, error } = await supabase
      .from('utm_clicks')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar UTMs de click direto:', error);
      return null;
    }

    if (clickData && clickData.length > 0) {
      console.log('🎯 UTMs encontrados para click direto:', clickData[0]);
      return {
        utm_source: clickData[0].utm_source,
        utm_medium: clickData[0].utm_medium,
        utm_campaign: clickData[0].utm_campaign,
        utm_content: clickData[0].utm_content,
        utm_term: clickData[0].utm_term
      };
    }

    console.log('❌ Nenhum UTM encontrado para click direto');
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar UTMs:', error);
    return null;
  }
};

export const handleDirectLead = async (params: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
}) => {
  const { supabase, message, realPhoneNumber } = params;
  
  console.log(`🆕 handleDirectLead - Novo contato direto de: ${realPhoneNumber}`);
  
  try {
    const messageContent = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          'Mensagem não disponível';
    
    // 🎯 TENTAR BUSCAR UTMs DE CLICK DIRETO
    const directUtms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
    
    // 🔍 BUSCAR CAMPANHA PELO utm_campaign E USAR O NOME DA CAMPANHA DO BANCO
    let campaignName = 'WhatsApp Orgânico';
    let campaignId = null;
    
    if (directUtms && directUtms.utm_campaign) {
      console.log(`🔍 Buscando campanha com utm_campaign: ${directUtms.utm_campaign}`);
      
      // Buscar campanha pelo utm_campaign no banco de dados
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, utm_campaign')
        .eq('utm_campaign', directUtms.utm_campaign)
        .limit(1);
      
      if (campaignError) {
        console.error('❌ Erro ao buscar campanha:', campaignError);
      } else if (campaignData && campaignData.length > 0) {
        // 🎯 USAR O NOME DA CAMPANHA DO BANCO DE DADOS
        campaignName = campaignData[0].name;
        campaignId = campaignData[0].id;
        console.log(`✅ Campanha encontrada no banco:`, {
          utm_campaign: directUtms.utm_campaign,
          campaign_name: campaignName,
          campaign_id: campaignId
        });
      } else {
        console.log(`❌ Nenhuma campanha encontrada com utm_campaign: ${directUtms.utm_campaign}`);
      }
    } else {
      console.log('📋 Nenhum utm_campaign encontrado, usando campanha padrão');
    }
    
    // Verificar se já existe um lead para este telefone
    const { data: existingLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('*')
      .eq('phone', realPhoneNumber)
      .limit(1);

    if (leadCheckError) {
      console.error('❌ Erro ao verificar lead existente:', leadCheckError);
      return;
    }

    if (existingLead && existingLead.length > 0) {
      console.log('📝 Lead direto existente encontrado, verificando se deve salvar primeira mensagem...');
      
      // 🎯 SALVAR PRIMEIRA MENSAGEM APENAS SE NÃO EXISTIR
      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: message.key?.id,
        evolution_status: message.status,
      };
      
      // Verificar se já tem mensagem salva
      if (!existingLead[0].last_message || existingLead[0].last_message.trim() === '') {
        updateData.last_message = messageContent;
        console.log('📝 Salvando primeira mensagem do lead direto existente:', messageContent);
      } else {
        console.log('📝 Lead direto já tem primeira mensagem, preservando:', existingLead[0].last_message);
      }

      const { error: updateError } = await supabase
        .from('leads')
        .update(updateData)
        .eq('id', existingLead[0].id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead direto existente:', updateError);
      } else {
        console.log('✅ Lead direto existente atualizado, primeira mensagem preservada:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          primeiraMensagem: updateData.last_message || existingLead[0].last_message
        });
      }
    } else {
      console.log('🆕 Criando novo lead direto com primeira mensagem...');
      
      // Determinar tipo de lead baseado na presença de UTMs
      const isDirectClick = !!directUtms;
      const leadUtms = directUtms || {
        utm_source: 'whatsapp',
        utm_medium: isDirectClick ? 'direct' : 'organic',
        utm_campaign: isDirectClick ? 'direct_click' : 'organic'
      };
      
      // Criar novo lead direto com primeira mensagem
      const newLeadData = {
        name: message.pushName || 'Lead via WhatsApp',
        phone: realPhoneNumber,
        campaign: campaignName, // 🎯 NOME DA CAMPANHA DO BANCO DE DADOS
        campaign_id: campaignId, // 🎯 ID DA CAMPANHA DO BANCO DE DADOS
        status: 'lead',
        last_message: messageContent, // 🎯 PRIMEIRA MENSAGEM SALVA
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString(),
        evolution_message_id: message.key?.id,
        evolution_status: message.status,
        notes: `Lead criado automaticamente via WhatsApp ${isDirectClick ? 'direto' : 'orgânico'}`,
        utm_source: leadUtms.utm_source,
        utm_medium: leadUtms.utm_medium,
        utm_campaign: leadUtms.utm_campaign,
        utm_content: leadUtms.utm_content,
        utm_term: leadUtms.utm_term
      };

      console.log(`🆕 Criando novo lead com campanha do banco:`, {
        utm_campaign_do_meta: directUtms?.utm_campaign,
        nome_campanha_do_banco: campaignName,
        campaign_id: campaignId,
        utms: leadUtms
      });

      const { error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData);

      if (insertError) {
        console.error('❌ Erro ao criar novo lead direto:', insertError);
      } else {
        console.log(`✅ Novo lead criado com campanha do banco: "${campaignName}"`, message.pushName || 'Lead via WhatsApp');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral em handleDirectLead:', error);
  }
};
