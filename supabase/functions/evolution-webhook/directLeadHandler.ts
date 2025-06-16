
import { getUtmsFromDirectClick } from './utmHandler.ts';

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
