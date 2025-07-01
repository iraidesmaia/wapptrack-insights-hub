
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { getTrackingDataBySession } from './sessionTrackingHandler.ts';
import { getContactName } from './helpers.ts';
import { logSecurityEvent } from './security.ts';
import { handleCTWACampaignLead } from './ctwaCampaignHandler.ts';

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
    if (message.contextInfo?.externalAdReply) {
      const adReply = message.contextInfo.externalAdReply;
      evolutionTrackingData = {
        source_id: adReply.sourceId || null,
        media_url: adReply.sourceUrl || null,
        ctwa_clid: adReply.ctwaClid || null,
        source_type: adReply.sourceType || null
      };
      
      console.log(`🎯 [EVOLUTION TRACKING] Dados de tracking extraídos da Evolution:`, evolutionTrackingData);
      
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
    if (evolutionTrackingData?.ctwa_clid) {
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

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${evolutionTrackingData?.ctwa_clid ? 'META ADS' : trackingCorrelation ? 'PAGO' : 'orgânico'} (nenhum lead existente encontrado)...`);

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

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${evolutionTrackingData?.ctwa_clid ? 'META ADS via Evolution' : trackingCorrelation ? 'PAGO' : 'orgânico'}:`, {
      metodo_atribuicao: evolutionTrackingData?.ctwa_clid ? 'evolution_meta_ads' : trackingCorrelation ? 'correlacao_paga' : 'organico',
      campaign_id: leadData.campaign_id,
      nome_campanha_do_banco: leadData.campaign,
      status: leadData.status,
      user_id: leadData.user_id,
      instance_name: instanceName,
      utms: finalUtms,
      evolution_data: evolutionTrackingData,
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

    console.log(`✅ [LEAD DIRETO] Novo lead ${evolutionTrackingData?.ctwa_clid ? 'META ADS' : trackingCorrelation ? 'PAGO' : 'orgânico'} criado: "${leadData.campaign}"`, {
      lead_id: newLead.id,
      name: newLead.name,
      user_id: responsibleUserId,
      instance_name: instanceName,
      evolution_tracking: evolutionTrackingData,
      was_paid_traffic: !!(evolutionTrackingData?.ctwa_clid || trackingCorrelation),
      confidence_score: trackingCorrelation?.confidence_score || 0
    });

    logSecurityEvent(`${evolutionTrackingData?.ctwa_clid ? 'Meta Ads' : trackingCorrelation ? 'Paid' : 'Organic'} lead created successfully`, {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      instance: instanceName,
      user_id: responsibleUserId,
      campaign_id: campaignId,
      tracking_method: leadData.tracking_method,
      evolution_data: evolutionTrackingData,
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
