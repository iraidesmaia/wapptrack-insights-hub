
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { getTrackingDataBySession } from './sessionTrackingHandler.ts';
import { createPhoneVariations } from './phoneNormalizer.ts';

// 🎯 NOVA FUNÇÃO PARA ENVIAR EVENTO LEAD PARA FACEBOOK
const sendFacebookLeadEvent = async (params: {
  supabase: any;
  leadData: any;
  campaignData: any;
  utms: any;
  deviceData: any;
}) => {
  const { supabase, leadData, campaignData, utms, deviceData } = params;
  
  try {
    // Verificar se a campanha tem Conversions API habilitado
    if (!campaignData?.conversion_api_enabled || !campaignData?.pixel_id || !campaignData?.facebook_access_token) {
      console.log('📋 Campanha não tem Conversions API habilitado ou dados do Facebook incompletos');
      return;
    }

    console.log('🎯 Enviando evento Lead para Facebook:', {
      pixel_id: campaignData.pixel_id,
      campaign_name: campaignData.name,
      lead_name: leadData.name
    });

    // Extrair fbclid dos UTMs (pode estar em utm_content ou utm_term)
    const fbclid = utms?.utm_content?.includes('fbclid') ? 
      utms.utm_content.split('fbclid=')[1]?.split('&')[0] : 
      utms?.utm_term?.includes('fbclid') ? 
      utms.utm_term.split('fbclid=')[1]?.split('&')[0] : null;

    // Extrair gclid dos UTMs
    const gclid = utms?.utm_content?.includes('gclid') ? 
      utms.utm_content.split('gclid=')[1]?.split('&')[0] : 
      utms?.utm_term?.includes('gclid') ? 
      utms.utm_term.split('gclid=')[1]?.split('&')[0] : null;

    // Preparar dados do usuário para Advanced Matching
    const userData = {
      phone: leadData.phone,
      firstName: leadData.name?.split(' ')[0] || '',
      lastName: leadData.name?.split(' ').slice(1).join(' ') || '',
      city: deviceData?.city || '',
      country: deviceData?.country || 'BR',
      clientIp: deviceData?.ip_address || '',
      userAgent: deviceData?.user_agent || '',
      fbc: fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined,
      fbp: undefined // Será gerado pelo Facebook se não disponível
    };

    // Preparar dados customizados
    const customData = {
      content_name: 'Lead WhatsApp Direto',
      content_category: 'lead',
      campaign_id: campaignData.id,
      lead_id: leadData.id,
      utm_source: utms?.utm_source,
      utm_medium: utms?.utm_medium,
      utm_campaign: utms?.utm_campaign,
      utm_content: utms?.utm_content,
      utm_term: utms?.utm_term,
      gclid: gclid,
      fbclid: fbclid
    };

    // Chamar a edge function facebook-conversions
    const { data: fbResponse, error: fbError } = await supabase.functions.invoke('facebook-conversions', {
      body: {
        pixelId: campaignData.pixel_id,
        accessToken: campaignData.facebook_access_token,
        eventName: 'Lead',
        userData: userData,
        customData: customData,
        testEventCode: campaignData.test_event_code || undefined
      }
    });

    if (fbError) {
      console.error('❌ Erro ao enviar evento Lead para Facebook:', fbError);
    } else {
      console.log('✅ Evento Lead enviado para Facebook com sucesso:', {
        pixel_id: campaignData.pixel_id,
        events_received: fbResponse?.events_received,
        fbclid: fbclid,
        gclid: gclid,
        lead_name: leadData.name
      });
    }
  } catch (error) {
    console.error('❌ Erro geral ao enviar evento Lead para Facebook:', error);
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
    
    // 📱 BUSCAR DADOS DO DISPOSITIVO PRIMEIRO
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
    
    // 🆕 BUSCAR DADOS DE TRACKING POR CORRELAÇÃO DE SESSÃO
    let trackingData = null;
    if (deviceData) {
      trackingData = await getTrackingDataBySession(supabase, deviceData);
      console.log('📊 Dados de tracking por correlação:', trackingData);
    }
    
    // 🎯 BUSCAR UTMs DE CLICK DIRETO (método antigo como fallback)
    const directUtms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
    
    // 🔍 DETERMINAR CAMPANHA E UTMs FINAIS
    let campaignName = 'WhatsApp Orgânico';
    let campaignId = null;
    let campaignData = null;
    let finalUtms = null;
    
    // Prioridade: tracking por correlação > UTMs diretos
    if (trackingData && trackingData.campaign_id) {
      console.log(`🎯 Usando dados de tracking correlacionados - Campaign ID: ${trackingData.campaign_id}`);
      
      // Buscar campanha pelo ID do tracking
      const { data: campaignById, error: campaignByIdError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', trackingData.campaign_id)
        .limit(1);
      
      if (!campaignByIdError && campaignById && campaignById.length > 0) {
        campaignData = campaignById[0];
        campaignName = campaignData.name;
        campaignId = campaignData.id;
        finalUtms = {
          utm_source: trackingData.utm_source,
          utm_medium: trackingData.utm_medium,
          utm_campaign: trackingData.utm_campaign,
          utm_content: trackingData.utm_content,
          utm_term: trackingData.utm_term
        };
        console.log(`✅ Campanha encontrada via tracking correlacionado:`, {
          campaign_id: campaignId,
          campaign_name: campaignName,
          match_type: trackingData.match_type
        });
      }
    }
    
    // Fallback para método antigo se não encontrou via correlação
    if (!campaignData && directUtms && directUtms.utm_campaign) {
      console.log(`🔍 Fallback: Buscando campanha com utm_campaign: ${directUtms.utm_campaign}`);
      
      const { data: campaignResult, error: campaignError } = await supabase
        .from('campaigns')
        .select('*')
        .eq('utm_campaign', directUtms.utm_campaign)
        .limit(1);
      
      if (!campaignError && campaignResult && campaignResult.length > 0) {
        campaignData = campaignResult[0];
        campaignName = campaignData.name;
        campaignId = campaignData.id;
        finalUtms = directUtms;
        console.log(`✅ Campanha encontrada via UTM fallback:`, {
          utm_campaign: directUtms.utm_campaign,
          campaign_name: campaignName,
          campaign_id: campaignId
        });
      }
    }
    
    // Se ainda não encontrou, usar padrão
    if (!finalUtms) {
      finalUtms = {
        utm_source: 'whatsapp',
        utm_medium: 'organic',
        utm_campaign: 'organic'
      };
      console.log('📋 Usando UTMs padrão (orgânico)');
    }
    
    // 🎯 CRIAR VARIAÇÕES DO TELEFONE PARA BUSCA FLEXÍVEL
    const phoneVariations = createPhoneVariations(realPhoneNumber);
    console.log(`📞 Buscando lead existente com variações do telefone:`, phoneVariations);
    
    // Verificar se já existe um lead para qualquer variação deste telefone
    const { data: existingLead, error: leadCheckError } = await supabase
      .from('leads')
      .select('*')
      .in('phone', phoneVariations)
      .order('created_at', { ascending: false })
      .limit(1);

    if (leadCheckError) {
      console.error('❌ Erro ao verificar lead existente:', leadCheckError);
      return;
    }

    if (existingLead && existingLead.length > 0) {
      console.log('📝 Lead existente encontrado:', {
        id: existingLead[0].id,
        name: existingLead[0].name,
        phone: existingLead[0].phone,
        status: existingLead[0].status,
        tem_device_data: !!existingLead[0].device_type
      });
      
      // 🎯 ATUALIZAR LEAD EXISTENTE
      const updateData: any = {
        last_contact_date: new Date().toISOString(),
        evolution_message_id: message.key?.id,
        evolution_status: message.status,
      };
      
      // 🚀 SE STATUS FOR 'new' (do formulário), MUDAR PARA 'lead' (confirmado via WhatsApp)
      let shouldSendFacebookEvent = false;
      if (existingLead[0].status === 'new') {
        updateData.status = 'lead';
        shouldSendFacebookEvent = true;
        console.log('🔄 Atualizando status de "new" para "lead" - lead confirmado via WhatsApp');
      }
      
      // 📱 INCLUIR DADOS DO DISPOSITIVO SE DISPONÍVEIS E NÃO EXISTIREM
      if (deviceData && !existingLead[0].device_type) {
        updateData.location = deviceData.location || '';
        updateData.ip_address = deviceData.ip_address || '';
        updateData.browser = deviceData.browser || '';
        updateData.os = deviceData.os || '';
        updateData.device_type = deviceData.device_type || '';
        updateData.device_model = deviceData.device_model || '';
        updateData.country = deviceData.country || '';
        updateData.city = deviceData.city || '';
        updateData.screen_resolution = deviceData.screen_resolution || '';
        updateData.timezone = deviceData.timezone || '';
        updateData.language = deviceData.language || '';
        console.log('📱 Adicionando dados do dispositivo ao lead existente');
      }
      
      // 💬 SALVAR PRIMEIRA MENSAGEM APENAS SE NÃO EXISTIR
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
        console.log('✅ Lead existente atualizado com sucesso:', {
          leadId: existingLead[0].id,
          nomePreservado: existingLead[0].name,
          statusAnterior: existingLead[0].status,
          statusNovo: updateData.status || existingLead[0].status,
          primeiraMensagem: updateData.last_message || existingLead[0].last_message,
          temDadosDispositivo: !!deviceData
        });

        // 🎯 ENVIAR EVENTO LEAD PARA FACEBOOK SE NECESSÁRIO
        if (shouldSendFacebookEvent && campaignData) {
          const leadDataForFb = {
            ...existingLead[0],
            ...updateData,
            id: existingLead[0].id,
            name: existingLead[0].name,
            phone: existingLead[0].phone
          };
          
          await sendFacebookLeadEvent({
            supabase,
            leadData: leadDataForFb,
            campaignData,
            utms: finalUtms,
            deviceData
          });
        }
      }
    } else {
      console.log('🆕 Criando novo lead direto (nenhum lead existente encontrado)...');
      
      // Determinar tipo de lead baseado na presença de UTMs
      const isDirectClick = !!(trackingData || directUtms);
      
      // Criar novo lead direto com primeira mensagem e dados do dispositivo
      const newLeadData = {
        name: message.pushName || 'Lead via WhatsApp',
        phone: realPhoneNumber,
        campaign: campaignName,
        campaign_id: campaignId,
        status: 'lead', // 🎯 NOVO LEAD DIRETO JÁ INICIA COMO 'lead'
        last_message: messageContent,
        first_contact_date: new Date().toISOString(),
        last_contact_date: new Date().toISOString(),
        evolution_message_id: message.key?.id,
        evolution_status: message.status,
        notes: `Lead criado automaticamente via WhatsApp ${isDirectClick ? 'direto (correlacionado)' : 'orgânico'}`,
        utm_source: finalUtms.utm_source,
        utm_medium: finalUtms.utm_medium,
        utm_campaign: finalUtms.utm_campaign,
        utm_content: finalUtms.utm_content,
        utm_term: finalUtms.utm_term,
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
        language: deviceData?.language || ''
      };

      console.log(`🆕 Criando novo lead direto:`, {
        metodo_atribuicao: trackingData ? 'tracking_correlacionado' : directUtms ? 'utm_direto' : 'organico',
        campaign_id: campaignId,
        nome_campanha_do_banco: campaignName,
        status: newLeadData.status,
        utms: finalUtms,
        tem_dados_dispositivo: !!deviceData
      });

      const { data: insertedLead, error: insertError } = await supabase
        .from('leads')
        .insert(newLeadData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar novo lead direto:', insertError);
      } else {
        console.log(`✅ Novo lead direto criado: "${campaignName}"`, message.pushName || 'Lead via WhatsApp');
        
        // 🎯 ENVIAR EVENTO LEAD PARA FACEBOOK PARA NOVO LEAD DIRETO
        if (campaignData && insertedLead) {
          await sendFacebookLeadEvent({
            supabase,
            leadData: insertedLead,
            campaignData,
            utms: finalUtms,
            deviceData
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Erro geral em handleDirectLead:', error);
  }
};
