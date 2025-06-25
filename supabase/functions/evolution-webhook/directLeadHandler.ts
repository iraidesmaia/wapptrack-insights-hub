
import { getUtmsFromDirectClick } from './utmHandler.ts';
import { getDeviceDataByPhone } from './deviceDataHandler.ts';
import { getTrackingDataBySession } from './sessionTrackingHandler.ts';
import { getContactName } from './helpers.ts';
import { logSecurityEvent } from './security.ts';

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
    
    if (trackingCorrelation && trackingCorrelation.confidence_score >= 60) {
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

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${trackingCorrelation ? 'PAGO' : 'orgânico'} (nenhum lead existente encontrado)...`);

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

    console.log(`🆕 [LEAD DIRETO] Criando novo lead ${trackingCorrelation ? 'PAGO' : 'orgânico'}:`, {
      metodo_atribuicao: trackingCorrelation ? 'correlacao_paga' : 'organico',
      campaign_id: leadData.campaign_id,
      nome_campanha_do_banco: leadData.campaign,
      status: leadData.status,
      user_id: leadData.user_id,
      instance_name: instanceName,
      utms: finalUtms,
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
        was_paid_traffic: !!trackingCorrelation,
        confidence_score: trackingCorrelation?.confidence_score || 0
      }, 'high');
      return;
    }

    console.log(`✅ [LEAD DIRETO] Novo lead ${trackingCorrelation ? 'PAGO' : 'orgânico'} criado: "${leadData.campaign}"`, {
      lead_id: newLead.id,
      name: newLead.name,
      user_id: responsibleUserId,
      instance_name: instanceName,
      was_paid_traffic: !!trackingCorrelation,
      confidence_score: trackingCorrelation?.confidence_score || 0
    });

    logSecurityEvent(`${trackingCorrelation ? 'Paid' : 'Organic'} lead created successfully`, {
      lead_id: newLead.id,
      phone: realPhoneNumber,
      instance: instanceName,
      user_id: responsibleUserId,
      campaign_id: campaignId,
      tracking_method: leadData.tracking_method,
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
