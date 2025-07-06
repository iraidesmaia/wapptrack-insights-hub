
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { getTrackingDataBySession } from './sessionTrackingHandler.ts';
import { getContactName } from './helpers.ts';
import { logSecurityEvent } from './security.ts';

/**
 * Handler especializado para leads vindos de campanhas CTWA
 * Associa dados do clique com a mensagem recebida
 */
const handleCTWACampaignLead = async ({ 
  supabase, 
  message, 
  realPhoneNumber, 
  instanceName,
  ctwaCLid 
}: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
  ctwaCLid: string;
}) => {
  console.log(`🎯 [CTWA LEAD] Processando lead de campanha CTWA: ${ctwaCLid} - ${realPhoneNumber}`);
  
  try {
    // 📱 PRIMEIRO: EXTRAIR E SALVAR DADOS DO DISPOSITIVO DA MENSAGEM
    const contextInfo = message.contextInfo?.externalAdReply;
    
    // Construir dados básicos do dispositivo baseados na origem Facebook/Meta
    const deviceData = {
      phone: realPhoneNumber,
      browser: 'Facebook App',
      device_type: 'mobile', // CTWA geralmente vem de mobile
      os: contextInfo?.osInfo || 'Mobile',
      user_agent: contextInfo?.userAgent || 'Facebook/WhatsApp Integration',
      referrer: 'facebook.com',
      ip_address: contextInfo?.clientIp || 'Unknown',
      location: contextInfo?.location || 'Unknown',
      country: contextInfo?.country || 'BR',
      city: contextInfo?.city || 'Unknown',
      language: 'pt-BR',
      screen_resolution: contextInfo?.screenResolution || '375x667',
      timezone: 'America/Fortaleza',
      utm_source: 'facebook',
      utm_medium: 'social',
      utm_campaign: `ctwa_${ctwaCLid.substring(0, 8)}`,
      utm_content: contextInfo?.sourceId || '',
      utm_term: contextInfo?.sourceUrl || '',
      facebook_ad_id: contextInfo?.fbAdId,
      facebook_adset_id: contextInfo?.fbAdsetId,
      facebook_campaign_id: contextInfo?.fbCampaignId,
      source_id: contextInfo?.sourceId,
      media_url: contextInfo?.sourceUrl,
      ctwa_clid: ctwaCLid
    };
    
    console.log(`📱 [CTWA DEVICE] Dados do dispositivo construídos:`, {
      phone: deviceData.phone,
      device_type: deviceData.device_type,
      browser: deviceData.browser,
      ctwa_clid: deviceData.ctwa_clid,
      utm_source: deviceData.utm_source,
      source_id: deviceData.source_id,
      media_url: deviceData.media_url
    });
    
    // 💾 SALVAR DADOS DO DISPOSITIVO
    try {
      const { error: deviceError } = await supabase
        .from('device_data')
        .upsert({
          ...deviceData
        }, {
          onConflict: 'phone'
        });
      
      if (deviceError) {
        console.error('❌ [CTWA DEVICE] Erro ao salvar dados do dispositivo:', deviceError);
      } else {
        console.log('✅ [CTWA DEVICE] Dados do dispositivo salvos com sucesso para telefone:', realPhoneNumber);
      }
    } catch (deviceSaveError) {
      console.error('❌ [CTWA DEVICE] Erro geral ao salvar device data:', deviceSaveError);
    }
  
    // 1. Buscar dados do clique original usando ctwa_clid
    const clickData = await findCTWAClickData(supabase, ctwaCLid);
    
    if (!clickData) {
      console.log(`❌ [CTWA LEAD] Dados do clique não encontrados para ctwa_clid: ${ctwaCLid}`);
      logSecurityEvent('CTWA click data not found', {
        ctwa_clid: ctwaCLid,
        phone: realPhoneNumber,
        instance: instanceName
      }, 'medium');
      return null;
    }
    
    console.log(`✅ [CTWA LEAD] Dados do clique encontrados:`, {
      ctwa_clid: ctwaCLid,
      campaign_id: clickData.campaign_id,
      utm_source: clickData.utm_source,
      ip_address: clickData.ip_address,
      device_type: clickData.device_type
    });
    
    // 2. Buscar dados da campanha
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', clickData.campaign_id)
      .single();
    
    if (campaignError || !campaignData) {
      console.log(`❌ [CTWA LEAD] Campanha não encontrada: ${clickData.campaign_id}`);
      logSecurityEvent('CTWA campaign not found', {
        ctwa_clid: ctwaCLid,
        campaign_id: clickData.campaign_id,
        phone: realPhoneNumber
      }, 'high');
      return null;
    }
    
    console.log(`✅ [CTWA LEAD] Campanha encontrada: ${campaignData.name}`);
    
    // 3. Verificar se lead já existe
    const phoneVariations = [
      realPhoneNumber,
      realPhoneNumber.slice(-10),
      `55${realPhoneNumber.slice(-10)}`,
      `5585${realPhoneNumber.slice(-8)}`
    ];
    
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, phone, ctwa_clid')
      .in('phone', phoneVariations)
      .limit(1);
    
    if (existingLead && existingLead.length > 0) {
      // Se lead existe mas não tem ctwa_clid, atualizar
      if (!existingLead[0].ctwa_clid) {
        console.log(`🔄 [CTWA LEAD] Atualizando lead existente com dados CTWA...`);
        
        const { error: updateError } = await supabase
          .from('leads')
          .update({
            ctwa_clid: ctwaCLid,
            campaign_id: clickData.campaign_id,
            utm_source: clickData.utm_source,
            utm_medium: clickData.utm_medium,
            utm_campaign: clickData.utm_campaign,
            utm_content: clickData.utm_content,
            utm_term: clickData.utm_term,
            source_id: clickData.source_id,
            media_url: clickData.media_url,
            ip_address: clickData.ip_address,
            device_type: clickData.device_type,
            browser: clickData.browser,
            os: clickData.os,
            screen_resolution: clickData.screen_resolution,
            language: clickData.language,
            timezone: clickData.timezone,
            tracking_method: 'ctwa_campaign'
          })
          .eq('id', existingLead[0].id);
        
        if (updateError) {
          console.error(`❌ [CTWA LEAD] Erro ao atualizar lead:`, updateError);
        } else {
          console.log(`✅ [CTWA LEAD] Lead existente atualizado com dados CTWA`);
        }
      } else {
        console.log(`⚠️ [CTWA LEAD] Lead já possui dados CTWA: ${existingLead[0].ctwa_clid}`);
      }
      
      return existingLead[0];
    }
    
    // 4. Criar novo lead com dados consolidados
    const leadData = {
      name: getContactName(message),
      phone: realPhoneNumber,
      campaign: campaignData.name,
      campaign_id: clickData.campaign_id,
      user_id: campaignData.user_id,
      status: 'lead',
      first_contact_date: new Date().toISOString(),
      last_message: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem via CTWA',
      
      // UTMs da campanha
      utm_source: clickData.utm_source || 'facebook',
      utm_medium: clickData.utm_medium || 'social',
      utm_campaign: clickData.utm_campaign || `ctwa_${ctwaCLid.substring(0, 8)}`,
      utm_content: clickData.utm_content,
      utm_term: clickData.utm_term,
      
      // Dados de tracking CTWA
      ctwa_clid: ctwaCLid,
      source_id: clickData.source_id,
      media_url: clickData.media_url,
      
      // Dados do dispositivo capturados no clique
      ip_address: clickData.ip_address,
      device_type: clickData.device_type,
      browser: clickData.browser,
      os: clickData.os,
      screen_resolution: clickData.screen_resolution,
      language: clickData.language,
      timezone: clickData.timezone,
      
      tracking_method: 'ctwa_campaign'
    };
    
    console.log(`🆕 [CTWA LEAD] Criando novo lead CTWA consolidado:`, {
      name: leadData.name,
      phone: leadData.phone,
      campaign: leadData.campaign,
      ctwa_clid: leadData.ctwa_clid,
      utm_source: leadData.utm_source,
      ip_address: leadData.ip_address,
      device_type: leadData.device_type
    });
    
    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    if (leadError) {
      console.error(`❌ [CTWA LEAD] Erro ao criar lead:`, leadError);
      logSecurityEvent('Failed to create CTWA lead', {
        error: leadError,
        ctwa_clid: ctwaCLid,
        phone: realPhoneNumber,
        campaign_id: clickData.campaign_id
      }, 'high');
      return null;
    }
    
    // 5. Atualizar device_data com telefone real
    await updateCTWADeviceDataWithPhone(supabase, ctwaCLid, realPhoneNumber);
    
    console.log(`✅ [CTWA LEAD] Lead CTWA criado com sucesso:`, {
      lead_id: newLead.id,
      name: newLead.name,
      campaign: newLead.campaign,
      ctwa_clid: newLead.ctwa_clid,
      tracking_method: newLead.tracking_method
    });
    
    logSecurityEvent('CTWA lead created successfully', {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      ctwa_clid: ctwaCLid,
      campaign_id: clickData.campaign_id,
      campaign_name: campaignData.name,
      ip_address: clickData.ip_address
    }, 'low');
    
    return newLead;
    
  } catch (error) {
    console.error(`💥 [CTWA LEAD] Erro em handleCTWACampaignLead:`, error);
    logSecurityEvent('Error in handleCTWACampaignLead', {
      error: error.message,
      ctwa_clid: ctwaCLid,
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
    return null;
  }
};

/**
 * Função helper para buscar dados de clique CTWA no webhook
 */
const findCTWAClickData = async (supabase: any, ctwaCLid: string) => {
  try {
    console.log('🔍 [CTWA TRACKER] Buscando dados do clique para ctwa_clid:', ctwaCLid);
    
    // Buscar nas últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Buscar na tabela tracking_sessions
    const { data: trackingData, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .eq('ctwa_clid', ctwaCLid)
      .gte('created_at', oneDayAgo)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ [CTWA TRACKER] Erro ao buscar dados de clique:', error);
      return null;
    }
    
    if (trackingData && trackingData.length > 0) {
      const session = trackingData[0];
      
      console.log('✅ [CTWA TRACKER] Dados do clique encontrados:', {
        ctwa_clid: session.ctwa_clid,
        campaign_id: session.campaign_id,
        ip_address: session.ip_address,
        created_at: session.created_at
      });
      
      return {
        campaign_id: session.campaign_id,
        ctwa_clid: session.ctwa_clid,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        browser_fingerprint: session.browser_fingerprint,
        session_id: session.session_id,
        device_type: session.screen_resolution ? 'desktop' : 'mobile',
        browser: session.user_agent?.includes('Chrome') ? 'Chrome' : 'Other',
        os: session.user_agent?.includes('Windows') ? 'Windows' : 'Other',
        screen_resolution: session.screen_resolution,
        language: session.language,
        timezone: session.timezone,
        utm_source: session.utm_source,
        utm_medium: session.utm_medium,
        utm_campaign: session.utm_campaign,
        utm_content: session.utm_content,
        utm_term: session.utm_term,
        source_id: session.source_id,
        media_url: session.media_url,
        source_url: session.current_url,
        referrer: session.referrer,
        timestamp: session.created_at
      };
    }
    
    console.log('❌ [CTWA TRACKER] Nenhum dado de clique encontrado para ctwa_clid:', ctwaCLid);
    return null;
    
  } catch (error) {
    console.error('❌ [CTWA TRACKER] Erro geral ao buscar dados de clique:', error);
    return null;
  }
};

/**
 * Atualiza device_data com telefone real quando mensagem é recebida
 */
const updateCTWADeviceDataWithPhone = async (supabase: any, ctwaCLid: string, realPhone: string): Promise<boolean> => {
  try {
    console.log('🔄 [CTWA TRACKER] Atualizando device_data com telefone real:', { ctwaCLid, realPhone });
    
    const { error } = await supabase
      .from('device_data')
      .update({ phone: realPhone })
      .eq('ctwa_clid', ctwaCLid)
      .eq('phone', `PENDING_CTWA_${ctwaCLid}`);
    
    if (error) {
      console.error('❌ [CTWA TRACKER] Erro ao atualizar device_data:', error);
      return false;
    }
    
    console.log('✅ [CTWA TRACKER] Device_data atualizado com telefone real');
    return true;
    
  } catch (error) {
    console.error('❌ [CTWA TRACKER] Erro geral ao atualizar device_data:', error);
    return false;
  }
};

export const handleDirectLead = async ({ 
  supabase, 
  message, 
  realPhoneNumber, 
  instanceName 
}: {
  supabase: any;
  message: any;
  realPhoneNumber: string;
  instanceName: string;
}) => {
  console.log(`🆕 [LEAD DIRETO] Novo contato direto de: ${realPhoneNumber} (instância: ${instanceName})`);
  
  try {
    // 🔍 Buscar usuário responsável pela instância
    console.log(`🔍 [LEAD DIRETO] Buscando usuário para instância: ${instanceName}`);
    
    const { data: userData, error: userError } = await supabase.rpc('get_user_by_instance', {
      instance_name_param: instanceName
    });

    let responsibleUserId = userData;

    if (userError || !responsibleUserId) {
      console.log(`❌ [LEAD DIRETO] Nenhum usuário encontrado para instância: ${instanceName}`);
      
      // Fallback: buscar pela primeira campanha ativa (método de fallback)
      console.log(`🔄 [LEAD DIRETO] Tentando buscar usuário pela primeira campanha ativa encontrada...`);
      const { data: fallbackCampaign } = await supabase
        .from('campaigns')
        .select('user_id')
        .eq('active', true)
        .limit(1)
        .single();

      if (fallbackCampaign?.user_id) {
        responsibleUserId = fallbackCampaign.user_id;
        console.log(`✅ [LEAD DIRETO] Usando usuário da primeira campanha ativa: ${responsibleUserId}`);
        
        logSecurityEvent('Fallback user assignment for organic lead', {
          instance: instanceName,
          phone: realPhoneNumber,
          fallback_user_id: responsibleUserId
        }, 'medium');
      } else {
        console.log(`❌ [LEAD DIRETO] Não foi possível determinar usuário responsável para instância: ${instanceName}`);
        logSecurityEvent('No user found for organic lead', {
          instance: instanceName,
          phone: realPhoneNumber
        }, 'high');
        return;
      }
    }

    // 🆕 EXTRAIR DADOS DE TRACKING DA EVOLUTION API
    let evolutionTrackingData = null;
    let facebookMappingData = null;
    
    if (message.contextInfo?.externalAdReply) {
      const adReply = message.contextInfo.externalAdReply;
      evolutionTrackingData = {
        source_id: adReply.sourceId || null,
        media_url: adReply.sourceUrl || null,
        ctwa_clid: adReply.ctwaClid || null,
        source_type: adReply.sourceType || null
      };
      
      console.log(`🎯 [EVOLUTION TRACKING] Dados de tracking extraídos da Evolution:`, evolutionTrackingData);
      
      // 🔍 BUSCAR MAPEAMENTO DETALHADO DO FACEBOOK
      if (evolutionTrackingData.source_id) {
        console.log(`🔍 [FACEBOOK MAPPING] Buscando dados detalhados para source_id: ${evolutionTrackingData.source_id}`);
        
        try {
          const { data: mappingData, error: mappingError } = await supabase
            .from('facebook_mappings')
            .select('*')
            .eq('source_id', evolutionTrackingData.source_id)
            .single();
          
          if (!mappingError && mappingData) {
            facebookMappingData = mappingData;
            console.log(`✅ [FACEBOOK MAPPING] Dados detalhados encontrados:`, {
              campaign_name: mappingData.campaign_name,
              ad_name: mappingData.ad_name,
              adset_id: mappingData.adset_id,
              campaign_id: mappingData.campaign_id
            });
          } else {
            console.log(`❌ [FACEBOOK MAPPING] Nenhum mapeamento encontrado para source_id: ${evolutionTrackingData.source_id}`);
          }
        } catch (mappingSearchError) {
          console.error(`💥 [FACEBOOK MAPPING] Erro ao buscar mapeamento:`, mappingSearchError);
        }
      }
      
      // 🎯 SE TEM CTWA_CLID, USAR HANDLER ESPECIALIZADO
      if (evolutionTrackingData.ctwa_clid) {
        console.log(`🎯 [CTWA] Processando com handler especializado CTWA: ${evolutionTrackingData.ctwa_clid}`);
        const ctwaCampaignLead = await handleCTWACampaignLead({
          supabase,
          message,
          realPhoneNumber,
          instanceName,
          ctwaCLid: evolutionTrackingData.ctwa_clid
        });
        
        if (ctwaCampaignLead) {
          console.log(`✅ [CTWA] Lead CTWA processado com sucesso:`, {
            lead_id: ctwaCampaignLead.id,
            name: ctwaCampaignLead.name,
            campaign: ctwaCampaignLead.campaign
          });
          return; // Retorna cedo, processamento completo
        } else {
          console.log(`⚠️ [CTWA] Handler CTWA falhou, continuando com fluxo normal...`);
        }
      }
    }

    // 🔍 Buscar dados do dispositivo associados ao telefone
    console.log(`🔍 [LEAD DIRETO] Buscando dados do dispositivo no banco para: ${realPhoneNumber}`);
    const deviceData = await getDeviceDataByPhone(supabase, realPhoneNumber);
    
    // 🔄 SISTEMA DE CORRELAÇÃO MELHORADO
    console.log(`🔄 [CORRELAÇÃO] Iniciando correlação melhorada com dados de tracking...`);
    const trackingCorrelation = await getTrackingDataBySession(supabase, {
      ...deviceData,
      phone: realPhoneNumber
    });
    
    let finalUtms;
    let campaignSource = 'WhatsApp Orgânico';
    let campaignId = null;
    let trackingMethod = 'organic';
    
    // 🆕 PRIORIZAR DADOS DA EVOLUTION SE DISPONÍVEIS
    if (evolutionTrackingData?.source_id && facebookMappingData) {
      console.log(`🎯 [FACEBOOK MAPPING] USANDO DADOS DETALHADOS DO MAPEAMENTO!`, facebookMappingData);
      
      campaignSource = facebookMappingData.campaign_name;
      trackingMethod = 'facebook_mapping_enriched';
      
      finalUtms = {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: facebookMappingData.campaign_name.toLowerCase().replace(/\s+/g, '-'),
        utm_content: evolutionTrackingData.source_id,
        utm_term: facebookMappingData.ad_name || evolutionTrackingData.media_url || ''
      };
      
      console.log(`✅ [FACEBOOK MAPPING] Usando dados enriquecidos do mapeamento Facebook:`, {
        campaign_name: campaignSource,
        ad_name: facebookMappingData.ad_name,
        utm_campaign: finalUtms.utm_campaign
      });
    } else if (evolutionTrackingData?.ctwa_clid) {
      console.log(`🎯 [EVOLUTION] TRACKING PAGO DETECTADO pela Evolution API!`, evolutionTrackingData);
      
      campaignSource = `Meta Ads - ${evolutionTrackingData.source_type || 'ad'}`;
      trackingMethod = 'evolution_api_meta';
      
      finalUtms = {
        utm_source: 'facebook',
        utm_medium: 'social',
        utm_campaign: `ctwa_${evolutionTrackingData.ctwa_clid.substring(0, 8)}`,
        utm_content: evolutionTrackingData.source_id || '',
        utm_term: evolutionTrackingData.media_url || ''
      };
      
      console.log(`✅ [EVOLUTION] Usando dados de tracking do Meta via Evolution API`);
    } else if (trackingCorrelation && trackingCorrelation.confidence_score >= 60) {
      console.log(`🎯 [CORRELAÇÃO] CORRELAÇÃO ENCONTRADA! Lead veio de tráfego pago:`, {
        campaign_id: trackingCorrelation.campaign_id,
        utm_source: trackingCorrelation.utm_source,
        utm_medium: trackingCorrelation.utm_medium,
        utm_campaign: trackingCorrelation.utm_campaign,
        match_type: trackingCorrelation.match_type,
        confidence_score: trackingCorrelation.confidence_score
      });
      
      // Buscar dados da campanha para obter o nome correto
      if (trackingCorrelation.campaign_id) {
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('name')
          .eq('id', trackingCorrelation.campaign_id)
          .single();
        
        if (campaignData) {
          campaignSource = campaignData.name;
          campaignId = trackingCorrelation.campaign_id;
        }
      }
      
      finalUtms = {
        utm_source: trackingCorrelation.utm_source,
        utm_medium: trackingCorrelation.utm_medium,
        utm_campaign: trackingCorrelation.utm_campaign,
        utm_content: trackingCorrelation.utm_content,
        utm_term: trackingCorrelation.utm_term
      };
      
      trackingMethod = `${trackingCorrelation.match_type}_${trackingCorrelation.confidence_score}`;
      
      console.log(`✅ [CORRELAÇÃO] Usando UTMs da campanha paga correlacionada com ${trackingCorrelation.confidence_score}% de confiança`);
    } else if (trackingCorrelation && trackingCorrelation.confidence_score < 60) {
      console.log(`⚠️ [CORRELAÇÃO] Correlação encontrada mas com baixa confiança (${trackingCorrelation.confidence_score}%), tratando como orgânico`);
      
      // Buscar UTMs de clicks diretos (método legado)
      const utms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
      
      finalUtms = utms || {
        utm_source: 'whatsapp',
        utm_medium: 'organic', 
        utm_campaign: 'organic'
      };
      
      trackingMethod = `low_confidence_${trackingCorrelation.confidence_score}`;
    } else {
      console.log(`❌ [CORRELAÇÃO] Nenhuma correlação encontrada, usando UTMs orgânicos`);
      
      // 🎯 Buscar UTMs de clicks diretos (método legado)
      const utms = await getUtmsFromDirectClick(supabase, realPhoneNumber);
      
      // 📋 Usar UTMs padrão se não encontrar nenhum
      finalUtms = utms || {
        utm_source: 'whatsapp',
        utm_medium: 'organic', 
        utm_campaign: 'organic'
      };
    }

    // 📞 Verificar se já existe um lead para este telefone antes de criar
    const phoneVariations = [
      realPhoneNumber,
      realPhoneNumber.slice(-10),
      `55${realPhoneNumber.slice(-10)}`,
      `5585${realPhoneNumber.slice(-8)}`
    ];
    
    console.log(`📞 [LEAD DIRETO] Buscando lead existente com variações do telefone: ${JSON.stringify(phoneVariations)}`);
    
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, name, phone')
      .in('phone', phoneVariations)
      .limit(1);

    if (existingLead && existingLead.length > 0) {
      console.log(`⚠️ [LEAD DIRETO] Lead já existe para este telefone: ${existingLead[0].name} (${existingLead[0].phone})`);
      return;
    }

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${facebookMappingData ? 'FACEBOOK MAPEADO' : evolutionTrackingData?.ctwa_clid ? 'META ADS' : trackingCorrelation ? 'PAGO' : 'orgânico'} (nenhum lead existente encontrado)...`);

    // 🆕 Criar novo lead direto
    const leadData = {
      name: getContactName(message),
      phone: realPhoneNumber,
      campaign: campaignSource,
      campaign_id: campaignId,
      user_id: responsibleUserId,
      status: 'lead',
      first_contact_date: new Date().toISOString(),
      last_message: message.message?.conversation || message.message?.extendedTextMessage?.text || 'Mensagem recebida',
      utm_source: finalUtms.utm_source,
      utm_medium: finalUtms.utm_medium,
      utm_campaign: finalUtms.utm_campaign,
      utm_content: finalUtms.utm_content || null,
      utm_term: finalUtms.utm_term || null,
      tracking_method: trackingMethod,
       // 🆕 INCLUIR DADOS DA EVOLUTION API
       ...(evolutionTrackingData && {
         source_id: evolutionTrackingData.source_id,
         media_url: evolutionTrackingData.media_url,
         ctwa_clid: evolutionTrackingData.ctwa_clid
       }),
       // 🎯 INCLUIR DADOS DO MAPEAMENTO FACEBOOK
       ...(facebookMappingData && {
         ad_set_name: facebookMappingData.adset_id,
         ad_name: facebookMappingData.ad_name
       }),
      // 🎯 Dados do dispositivo se disponíveis
      ...(deviceData && {
        location: deviceData.location,
        ip_address: deviceData.ip_address,
        browser: deviceData.browser,
        os: deviceData.os,
        device_type: deviceData.device_type,
        device_model: deviceData.device_model,
        country: deviceData.country,
        city: deviceData.city,
        screen_resolution: deviceData.screen_resolution,
        timezone: deviceData.timezone,
        language: deviceData.language,
        facebook_ad_id: deviceData.facebook_ad_id,
        facebook_adset_id: deviceData.facebook_adset_id,
        facebook_campaign_id: deviceData.facebook_campaign_id
      })
    };

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${facebookMappingData ? 'FACEBOOK MAPEADO' : evolutionTrackingData?.ctwa_clid ? 'META ADS via Evolution' : trackingCorrelation ? 'PAGO' : 'orgânico'}:`, {
      metodo_atribuicao: facebookMappingData ? 'facebook_mapping_enriched' : evolutionTrackingData?.ctwa_clid ? 'evolution_meta_ads' : trackingCorrelation ? 'correlacao_paga' : 'organico',
      campaign_id: leadData.campaign_id,
      nome_campanha_do_banco: leadData.campaign,
      status: leadData.status,
      user_id: leadData.user_id,
      instance_name: instanceName,
      utms: finalUtms,
      evolution_data: evolutionTrackingData,
      facebook_mapping: facebookMappingData,
      tem_dados_dispositivo: !!deviceData,
      tracking_method: leadData.tracking_method,
      confidence_score: trackingCorrelation?.confidence_score || 0
    });

    const { data: newLead, error: leadError } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (leadError) {
      console.error(`❌ [LEAD DIRETO] Erro ao criar lead:`, leadError);
      logSecurityEvent('Failed to create lead', {
        error: leadError,
        phone: realPhoneNumber,
        instance: instanceName,
        user_id: responsibleUserId,
        evolution_tracking: evolutionTrackingData,
        was_paid_traffic: !!(evolutionTrackingData?.ctwa_clid || trackingCorrelation),
        confidence_score: trackingCorrelation?.confidence_score || 0
      }, 'high');
      return;
    }

    console.log(`✅ [LEAD DIRETO] Novo lead ${facebookMappingData ? 'FACEBOOK MAPEADO' : evolutionTrackingData?.ctwa_clid ? 'META ADS' : trackingCorrelation ? 'PAGO' : 'orgânico'} criado: "${leadData.campaign}"`, {
      lead_id: newLead.id,
      name: newLead.name,
      user_id: responsibleUserId,
      instance_name: instanceName,
      evolution_tracking: evolutionTrackingData,
      facebook_mapping: facebookMappingData,
      was_paid_traffic: !!(facebookMappingData || evolutionTrackingData?.ctwa_clid || trackingCorrelation),
      confidence_score: trackingCorrelation?.confidence_score || 0
    });

    logSecurityEvent(`${facebookMappingData ? 'Facebook Mapped' : evolutionTrackingData?.ctwa_clid ? 'Meta Ads' : trackingCorrelation ? 'Paid' : 'Organic'} lead created successfully`, {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      instance: instanceName,
      user_id: responsibleUserId,
      campaign_id: campaignId,
      tracking_method: leadData.tracking_method,
      evolution_data: evolutionTrackingData,
      facebook_mapping: facebookMappingData,
      confidence_score: trackingCorrelation?.confidence_score || 0
    }, 'low');

  } catch (error) {
    console.error(`💥 [LEAD DIRETO] Erro em handleDirectLead:`, error);
    logSecurityEvent('Error in handleDirectLead', {
      error: error.message,
      phone: realPhoneNumber,
      instance: instanceName
    }, 'high');
  }
};
