
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { createPhoneSearchVariations } from './phoneVariations.ts';

export const handlePendingLeadConversion = async (supabase: any, phone: string, messageText: string, messageId: string, status: string, contactName?: string) => {
  console.log(`🔄 handlePendingLeadConversion - Verificando pending_lead para: ${phone}`);
  
  try {
    // 🎯 BUSCAR LEAD EXISTENTE COM VARIAÇÕES DO TELEFONE PRIMEIRO
    const phoneVariations = createPhoneSearchVariations(phone);
    console.log('📞 Variações de telefone para busca:', phoneVariations);
    
    const { data: existingLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('*')
      .in('phone', phoneVariations)
      .limit(1);

    if (leadCheckError) {
      console.error('❌ Erro ao verificar lead existente:', leadCheckError);
      return;
    }

    if (existingLead && existingLead.length > 0) {
      console.log('🔒 Lead já existe, preservando NOME ORIGINAL e apenas atualizando mensagem:', {
        leadId: existingLead[0].id,
        nomeOriginalPreservado: existingLead[0].name,
        nomeContatoIgnorado: contactName,
        telefoneOriginal: existingLead[0].phone,
        telefoneRecebido: phone
      });
      
      // 📱 BUSCAR DADOS DO DISPOSITIVO
      const deviceData = await getDeviceDataByPhone(supabase, phone);
      
      // 🔒 PRESERVAR NOME ORIGINAL DO LEAD e adicionar dados do dispositivo
      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: messageId,
        evolution_status: status,
      };
      
      // Adicionar dados do dispositivo se disponíveis
      if (deviceData) {
        updateData.custom_fields = {
          ...existingLead[0].custom_fields,
          device_info: deviceData
        };
        console.log('📱 Adicionando dados do dispositivo ao lead existente');
      }
      
      // 🎯 SALVAR PRIMEIRA MENSAGEM APENAS SE NÃO EXISTIR
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
        console.log('✅ Lead existente atualizado preservando nome original:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          primeiraMensagem: updateData.last_message || existingLead[0].last_message,
          temDadosDispositivo: !!deviceData
        });
      }
      
      // ❌ NÃO BUSCAR PENDING_LEAD SE JÁ EXISTE LEAD
      console.log('⏭️ Lead já existe, pulando busca de pending_lead para evitar duplicação');
      return;
    }

    // 🔍 BUSCAR PENDING_LEAD APENAS SE NÃO EXISTE LEAD
    console.log('🔍 Nenhum lead existente encontrado, buscando pending_lead...');
    
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

    // 📱 BUSCAR DADOS DO DISPOSITIVO
    const deviceData = await getDeviceDataByPhone(supabase, phone);

    // 🔒 PRESERVAR SEMPRE O NOME DO FORMULÁRIO (pending_lead.name)
    const finalName = (pendingLead.name && pendingLead.name !== 'Visitante') 
      ? pendingLead.name 
      : (contactName || 'Lead via WhatsApp');

    console.log('🔒 Nome que será usado no lead final (preservando formulário):', {
      nomePendingLead: pendingLead.name,
      nomeContato: contactName,
      nomeFinal: finalName,
      temDadosDispositivo: !!deviceData
    });

    console.log('🆕 Criando novo lead a partir do pending_lead com primeira mensagem e dados do dispositivo...');
    
    // Criar novo lead com os dados do pending_lead, primeira mensagem e dados do dispositivo
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
      utm_term: pendingLead.utm_term,
      // 📱 INCLUIR DADOS DO DISPOSITIVO
      custom_fields: deviceData ? { device_info: deviceData } : null
    };

    console.log('💾 Dados do novo lead (com primeira mensagem, UTMs e dados do dispositivo):', {
      ...newLeadData,
      tem_dados_dispositivo: !!deviceData
    });

    const { error: insertError } = await supabase
      .from('leads')
      .insert(newLeadData);

    if (insertError) {
      console.error('❌ Erro ao criar novo lead:', insertError);
    } else {
      console.log('✅ Novo lead criado com primeira mensagem e dados do dispositivo preservados!');
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
