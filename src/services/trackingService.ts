import { supabase } from "../integrations/supabase/client";
import { getDeviceDataByPhone } from "./deviceDataService";
import { saveTrackingData } from './sessionTrackingService';

/**
 * Função principal para rastrear redirecionamentos e salvar leads
 */
export const trackRedirect = async (
  campaignId: string, 
  phone: string, 
  name?: string,
  eventType?: string,
  utms?: {
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
    utm_content?: string
    utm_term?: string
    gclid?: string
    fbclid?: string
    // 🆕 NOVOS PARÂMETROS
    source_id?: string
    media_url?: string
    ctwa_clid?: string
  }
): Promise<{targetPhone?: string}> => {
  try {
    console.log('➡️ [TRACK REDIRECT] Iniciado com parâmetros:', {
      campaignId,
      phone,
      name,
      eventType,
      utms
    });

    // Busca a campanha por ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Campanha não encontrada -> fallback default
    if (campaignError || !campaign) {
      console.log(`❌ Campaign with ID ${campaignId} not found. Creating default lead.`);
      return { targetPhone: '5585998372658' };
    }

    const type = eventType || campaign.event_type || 'lead';

    // 💾 NOVA FUNCIONALIDADE: Salvar dados de tracking para correlação futura
    if (utms && Object.keys(utms).length > 0) {
      console.log('💾 Salvando dados de tracking para correlação futura...');
      await saveTrackingData(utms, campaignId);
    }

    // Para campanhas de redirecionamento WhatsApp
    if (campaign.redirect_type === 'whatsapp') {
      console.log(`🚦 Campanha de redirecionamento WhatsApp`, {
        id: campaign.id,
        name: campaign.name,
        utms
      });
      
      return { targetPhone: campaign.whatsapp_number };
    }

    // Para campanhas de formulário, criar lead diretamente
    if ((type === 'lead' || type === 'contact') && phone) {
      console.log('📝 [FORMULÁRIO] Processando campanha de formulário...');
      
      // Buscar dados do dispositivo para enriquecer o lead
      const deviceData = await getDeviceDataByPhone(phone);
      
      const leadData = {
        name: name || 'Lead via Tracking',
        phone,
        campaign: campaign.name,
        campaign_id: campaignId,
        status: 'new' as const,
        utm_source: utms?.utm_source || '',
        utm_medium: utms?.utm_medium || '',
        utm_campaign: utms?.utm_campaign || '',
        utm_content: utms?.utm_content || (utms?.gclid ? `gclid=${utms.gclid}` : '') || (utms?.ctwa_clid ? `ctwa_clid=${utms.ctwa_clid}` : '') || '',
        utm_term: utms?.utm_term || (utms?.fbclid ? `fbclid=${utms.fbclid}` : '') || '',
        tracking_method: 'form_submission',
        // Incluir dados do dispositivo se disponíveis
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
          facebook_campaign_id: deviceData.facebook_campaign_id,
          // 🆕 NOVOS CAMPOS
          source_id: deviceData.source_id,
          media_url: deviceData.media_url,
          ctwa_clid: deviceData.ctwa_clid,
        })
      };
      
      console.log('📝 [FORMULÁRIO] Criando lead com novos parâmetros:', {
        source_id: leadData.source_id,
        media_url: leadData.media_url,
        ctwa_clid: leadData.ctwa_clid
      });

      const { error: leadError } = await supabase
        .from('leads')
        .insert(leadData);

      if (leadError) {
        console.error('❌ [FORMULÁRIO] Erro ao criar lead:', leadError);
      } else {
        console.log('✅ [FORMULÁRIO] Lead criado com sucesso');
      }
    }

    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('❌ [TRACK REDIRECT] Erro geral:', error);
    return { targetPhone: '5585998372658' };
  }
};
