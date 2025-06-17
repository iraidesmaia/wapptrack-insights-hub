
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { createPhoneSearchVariations } from './phoneVariations.ts';

export const handleDirectLead = async ({ supabase, message, realPhoneNumber }) => {
  console.log(`🆕 handleDirectLead - Novo contato direto de: ${realPhoneNumber}`);
  
  try {
    const messageContent = message.message?.conversation || 
                          message.message?.extendedTextMessage?.text || 
                          message.message?.imageMessage?.caption ||
                          'Mensagem não identificada';
    
    const contactName = message.pushName || 'Lead via WhatsApp';
    const messageId = message.key?.id || '';
    const status = message.status || 'delivered';

    // 🔍 VERIFICAR SE JÁ EXISTE LEAD COM ESTE TELEFONE (usando variações COMPLETAS)
    console.log('🔍 Verificando se já existe lead para este telefone...');
    const phoneVariations = createPhoneSearchVariations(realPhoneNumber);
    console.log('📞 Variações de telefone para busca:', phoneVariations);
    
    const { data: existingLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('*')
      .in('phone', phoneVariations)
      .limit(1);

    if (leadCheckError) {
      console.error('❌ Erro ao verificar lead existente:', leadCheckError);
    } else if (existingLead && existingLead.length > 0) {
      console.log('🔒 Lead existente encontrado, preservando NOME ORIGINAL e apenas atualizando mensagem:', {
        leadId: existingLead[0].id,
        nomeOriginalPreservado: existingLead[0].name,
        nomeContatoIgnorado: contactName,
        telefoneOriginal: existingLead[0].phone,
        telefoneRecebido: realPhoneNumber
      });

      // 📱 BUSCAR DADOS DO DISPOSITIVO
      const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
      
      // 🔒 PRESERVAR NOME ORIGINAL e apenas atualizar dados necessários
      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: messageId,
        evolution_status: status
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
        updateData.last_message = messageContent;
        console.log('📝 Salvando primeira mensagem do lead existente:', messageContent);
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
          primeiraMensagem: updateData.last_message || existingLead[0].last_message
        });
      }
      
      return;
    }

    console.log('🆕 Criando novo lead direto com primeira mensagem e dados do dispositivo...');
    
    // 🔍 BUSCAR UTMs de clicks diretos
    const utms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
    
    // 📱 BUSCAR DADOS DO DISPOSITIVO
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
    
    // Buscar campanha pelo utm_campaign se disponível
    let campaignName = 'WhatsApp Orgânico';
    let campaignId = null;
    
    if (utms?.utm_campaign) {
      console.log('🔍 Buscando campanha por utm_campaign:', utms.utm_campaign);
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('utm_campaign', utms.utm_campaign)
        .limit(1);
      
      if (campaign && campaign.length > 0) {
        campaignName = campaign[0].name;
        campaignId = campaign[0].id;
        console.log('✅ Campanha encontrada no banco:', { id: campaignId, name: campaignName });
      } else {
        console.log('📋 Nenhuma campanha encontrada para utm_campaign, usando padrão');
      }
    } else {
      console.log('📋 Nenhum utm_campaign encontrado, usando campanha padrão');
    }
    
    // Criar novo lead direto
    const newLeadData = {
      name: contactName,
      phone: realPhoneNumber,
      campaign: campaignName,
      campaign_id: campaignId,
      status: 'lead',
      last_message: messageContent, // 🎯 PRIMEIRA MENSAGEM SALVA
      first_contact_date: new Date().toISOString(),
      last_contact_date: new Date().toISOString(),
      evolution_message_id: messageId,
      evolution_status: status,
      notes: 'Lead criado automaticamente via WhatsApp (contato direto)',
      utm_source: utms?.utm_source || 'whatsapp',
      utm_medium: utms?.utm_medium || 'organic',
      utm_campaign: utms?.utm_campaign || 'organic',
      utm_content: utms?.utm_content || null,
      utm_term: utms?.utm_term || null,
      // 📱 INCLUIR DADOS DO DISPOSITIVO SE DISPONÍVEIS
      location: deviceData?.location || '',
      ip_address: deviceData?.ip_address || '',
      browser: deviceData?.browser || '',
      os: deviceData?.os || '',
      device_type: deviceData?.device_type || '',
      device_model: deviceData?.device_model || '',
      country: deviceData?.country || '',
      city: deviceData?.city || '',
      screen_resolution: deviceData?.screen_resolution || '',
      timezone: deviceData?.timezone || '',
      language: deviceData?.language || '',
      custom_fields: deviceData ? { device_info: deviceData } : null
    };

    console.log('🆕 Criando novo lead com campanha do banco e dados do dispositivo:', {
      utm_campaign_do_meta: utms?.utm_campaign,
      nome_campanha_do_banco: campaignName,
      campaign_id: campaignId,
      utms: {
        utm_source: newLeadData.utm_source,
        utm_medium: newLeadData.utm_medium,
        utm_campaign: newLeadData.utm_campaign
      },
      tem_dados_dispositivo: !!deviceData
    });

    const { error: insertError } = await supabase
      .from('leads')
      .insert(newLeadData);

    if (insertError) {
      console.error('❌ Erro ao criar novo lead:', insertError);
    } else {
      console.log(`✅ Novo lead criado com campanha do banco e dados do dispositivo: "${campaignName}" ${contactName}`);
    }

  } catch (error) {
    console.error('❌ Erro em handleDirectLead:', error);
  }
};
