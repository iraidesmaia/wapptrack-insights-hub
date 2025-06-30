
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';

export const createFacebookAdsDemo = async (): Promise<Lead | null> => {
  try {
    console.log('🎯 Criando lead de demonstração do Facebook Ads...');
    
    // Simular dados que viriam da Evolution API para um anúncio do Facebook
    const evolutionTrackingData = {
      source_id: "120224327256080723",
      media_url: "https://www.instagram.com/p/DLXbeFpsMH_/",
      ctwa_clid: "AffI2Qc02348Le0FElreNw1Yw5vXaP5rtc5J5aREbt40XWJfkpH7gZu3Ss87hd_X_vq5diqGpA4ASZzQv5Mm3cVKHrX_Ia6phKhs9Q03KfPjsDWeFo41e_k9KLeH7qqh6a4ORgmxFA",
      source_type: "ad"
    };

    // Dados do dispositivo simulados (como se o usuário tivesse clicado no anúncio)
    const deviceData = {
      device_type: "mobile",
      browser: "Instagram App",
      os: "Android",
      location: "Fortaleza, CE",
      ip_address: "201.23.45.67",
      country: "Brasil",
      city: "Fortaleza",
      screen_resolution: "412x915",
      timezone: "America/Fortaleza",
      language: "pt-BR"
    };

    // UTMs que seriam gerados pelo Facebook
    const utms = {
      utm_source: "facebook",
      utm_medium: "social",
      utm_campaign: `ctwa_${evolutionTrackingData.ctwa_clid.substring(0, 8)}`,
      utm_content: evolutionTrackingData.source_id,
      utm_term: evolutionTrackingData.media_url
    };

    const leadData = {
      name: "Maria Silva (Demo Facebook Ads)",
      phone: "5585987654321",
      campaign: "Meta Ads - ad",
      campaign_id: null,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      status: 'lead' as const,
      first_contact_date: new Date().toISOString(),
      last_message: "Olá! Vi seu anúncio no Instagram e gostaria de saber mais informações sobre o produto.",
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
      tracking_method: 'evolution_api_meta',
      
      // Dados da Evolution API
      source_id: evolutionTrackingData.source_id,
      media_url: evolutionTrackingData.media_url,
      ctwa_clid: evolutionTrackingData.ctwa_clid,
      
      // Dados do dispositivo
      location: deviceData.location,
      ip_address: deviceData.ip_address,
      browser: deviceData.browser,
      os: deviceData.os,
      device_type: deviceData.device_type,
      country: deviceData.country,
      city: deviceData.city,
      screen_resolution: deviceData.screen_resolution,
      timezone: deviceData.timezone,
      language: deviceData.language,
      
      // Facebook Ads específicos (que seriam extraídos do ctwa_clid)
      facebook_ad_id: "23851234567890123",
      facebook_adset_id: "23851234567890124", 
      facebook_campaign_id: "23851234567890125"
    };

    console.log('📊 Dados do lead Facebook Ads demo:', {
      metodo_atribuicao: 'evolution_meta_ads',
      campanha: leadData.campaign,
      source_id: leadData.source_id,
      media_url: leadData.media_url,
      ctwa_clid: leadData.ctwa_clid.substring(0, 20) + '...',
      utm_source: leadData.utm_source,
      device_type: leadData.device_type,
      location: leadData.location
    });

    const { data: newLead, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar lead demo:', error);
      return null;
    }

    console.log('✅ Lead de demonstração Facebook Ads criado:', {
      id: newLead.id,
      name: newLead.name,
      campaign: newLead.campaign,
      tracking_method: newLead.tracking_method,
      tem_dados_evolution: !!(newLead.ctwa_clid && newLead.source_id),
      tem_dados_facebook: !!(newLead.facebook_ad_id && newLead.facebook_campaign_id)
    });

    return {
      id: newLead.id,
      name: newLead.name,
      phone: newLead.phone,
      campaign: newLead.campaign,
      status: newLead.status as Lead['status'],
      created_at: newLead.created_at,
      custom_fields: newLead.custom_fields as Record<string, string> || {},
      notes: newLead.notes,
      first_contact_date: newLead.first_contact_date,
      last_contact_date: newLead.last_contact_date,
      last_message: newLead.last_message,
      utm_source: newLead.utm_source || '',
      utm_medium: newLead.utm_medium || '',
      utm_campaign: newLead.utm_campaign || '',
      utm_content: newLead.utm_content || '',
      utm_term: newLead.utm_term || '',
      location: newLead.location || '',
      ip_address: newLead.ip_address || '',
      browser: newLead.browser || '',
      os: newLead.os || '',
      device_type: newLead.device_type || '',
      device_model: newLead.device_model || '',
      tracking_method: newLead.tracking_method || '',
      ad_account: newLead.ad_account || '',
      ad_set_name: newLead.ad_set_name || '',
      ad_name: newLead.ad_name || '',
      initial_message: newLead.initial_message || '',
      country: newLead.country || '',
      city: newLead.city || '',
      screen_resolution: newLead.screen_resolution || '',
      timezone: newLead.timezone || '',
      language: newLead.language || '',
      facebook_ad_id: newLead.facebook_ad_id || '',
      facebook_adset_id: newLead.facebook_adset_id || '',
      facebook_campaign_id: newLead.facebook_campaign_id || ''
    };

  } catch (error) {
    console.error('❌ Erro geral ao criar lead demo:', error);
    return null;
  }
};
