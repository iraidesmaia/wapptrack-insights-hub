
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
    // Se o pending_lead tem um nome válido (não é "Visitante"), usar sempre esse nome
    // Caso contrário, usar o nome do contato do WhatsApp como fallback
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
      console.log('📝 Lead existente encontrado, atualizando mensagem e preservando nome original...');
      
      // 🔒 ATUALIZAR APENAS A MENSAGEM - PRESERVAR O NOME ORIGINAL DO LEAD
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_contact_date: new Date().toISOString(),
          evolution_message_id: messageId,
          evolution_status: status,
          // NÃO atualizar o nome - preservar o nome original do formulário
        })
        .eq('id', existingLead[0].id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead existente:', updateError);
      } else {
        console.log('✅ Lead existente atualizado com nova mensagem, nome preservado:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          novaMensagem: messageText
        });
      }
    } else {
      console.log('🆕 Criando novo lead a partir do pending_lead...');
      
      // Criar novo lead com os dados do pending_lead e UTMs corretos
      const newLeadData = {
        name: finalName, // 🔒 Nome do formulário preservado
        phone: phone,
        campaign: pendingLead.campaign_name || 'WhatsApp',
        campaign_id: pendingLead.campaign_id,
        status: 'lead',
        last_message: messageText,
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

      console.log('💾 Dados do novo lead (com UTMs do pending_lead):', newLeadData);

      const { error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData);

      if (insertError) {
        console.error('❌ Erro ao criar novo lead:', insertError);
      } else {
        console.log('✅ Novo lead criado com sucesso com UTMs preservados do formulário!');
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

export const handleDirectLead = async (supabase: any, phone: string, messageText: string, messageId: string, status: string, contactName?: string) => {
  console.log(`🆕 handleDirectLead - Novo contato direto de: ${phone}`);
  
  try {
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
      console.log('📝 Lead direto existente encontrado, atualizando mensagem e preservando nome original...');
      
      // 🔒 ATUALIZAR APENAS A MENSAGEM - PRESERVAR O NOME ORIGINAL DO LEAD
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          last_message: messageText,
          last_contact_date: new Date().toISOString(),
          evolution_message_id: messageId,
          evolution_status: status,
          // NÃO atualizar o nome - preservar o nome original
        })
        .eq('id', existingLead[0].id);

      if (updateError) {
        console.error('❌ Erro ao atualizar lead direto existente:', updateError);
      } else {
        console.log('✅ Lead direto existente atualizado, nome preservado:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          novaMensagem: messageText
        });
      }
    } else {
      console.log('🆕 Criando novo lead direto...');
      
      // Criar novo lead direto
      const newLeadData = {
        name: contactName || 'Lead via WhatsApp',
        phone: phone,
        campaign: 'WhatsApp Direto',
        status: 'lead',
        last_message: messageText,
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString(),
        evolution_message_id: messageId,
        evolution_status: status,
        notes: 'Lead criado automaticamente via WhatsApp direto',
        utm_source: 'whatsapp',
        utm_medium: 'direct',
        utm_campaign: 'organic'
      };

      console.log('🆕 Criando novo lead direto com status LEAD:', newLeadData);

      const { error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData);

      if (insertError) {
        console.error('❌ Erro ao criar novo lead direto:', insertError);
      } else {
        console.log('✅ Novo lead direto criado com sucesso:', contactName || 'Lead via WhatsApp');
      }
    }
  } catch (error) {
    console.error('❌ Erro geral em handleDirectLead:', error);
  }
};
