
import { supabase } from '@/integrations/supabase/client';

export interface DeviceDataCapture {
  phone?: string;
  ip_address?: string;
  user_agent?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  device_model?: string;
  location?: string;
  country?: string;
  city?: string;
  referrer?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  facebook_ad_id?: string;
  facebook_adset_id?: string;
  facebook_campaign_id?: string;
  // 🆕 NOVOS CAMPOS ADICIONADOS
  source_id?: string;
  media_url?: string;
  ctwa_clid?: string;
}

export const captureDeviceData = async (phone?: string): Promise<DeviceDataCapture> => {
  try {
    console.log('📱 Capturando dados do dispositivo para telefone:', phone);
    
    // Coletar dados básicos do dispositivo
    const userAgent = navigator.userAgent;
    const screenResolution = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Coletar parâmetros da URL
    const urlParams = new URLSearchParams(window.location.search);
    const utm_source = urlParams.get('utm_source');
    const utm_medium = urlParams.get('utm_medium');
    const utm_campaign = urlParams.get('utm_campaign');
    const utm_content = urlParams.get('utm_content');
    const utm_term = urlParams.get('utm_term');
    const facebook_ad_id = urlParams.get('facebook_ad_id') || urlParams.get('ad_id');
    const facebook_adset_id = urlParams.get('facebook_adset_id') || urlParams.get('adset_id');
    const facebook_campaign_id = urlParams.get('facebook_campaign_id') || urlParams.get('campaign_id');
    
    // 🆕 CAPTURAR NOVOS PARÂMETROS
    const source_id = urlParams.get('source_id');
    const media_url = urlParams.get('media_url');
    const ctwa_clid = urlParams.get('ctwa_clid');
    
    const deviceData: DeviceDataCapture = {
      phone,
      ip_address: 'Detectando...',
      user_agent: userAgent,
      browser: getBrowserName(userAgent),
      os: getOperatingSystem(userAgent),
      device_type: getDeviceType(userAgent),
      device_model: getDeviceType(userAgent),
      location: 'Detectando...',
      country: 'Brasil',
      city: 'Detectando...',
      referrer: document.referrer,
      screen_resolution: screenResolution,
      timezone,
      language,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      facebook_ad_id,
      facebook_adset_id,
      facebook_campaign_id,
      // 🆕 INCLUIR NOVOS CAMPOS
      source_id,
      media_url,
      ctwa_clid,
    };
    
    console.log('📱 Dados do dispositivo capturados com novos parâmetros:', {
      source_id,
      media_url,
      ctwa_clid,
      phone: deviceData.phone
    });
    
    return deviceData;
  } catch (error) {
    console.error('❌ Erro ao capturar dados do dispositivo:', error);
    return {};
  }
};

export const saveDeviceData = async (deviceData: DeviceDataCapture) => {
  try {
    console.log('💾 Salvando dados do dispositivo:', deviceData);
    
    if (!deviceData.phone) {
      console.warn('⚠️ Telefone não fornecido, não salvando dados do dispositivo');
      return null;
    }
    
    // Verificar se já existe dados para este telefone
    const { data: existingData } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', deviceData.phone)
      .single();
    
    if (existingData) {
      // Atualizar dados existentes
      const { data, error } = await supabase
        .from('device_data')
        .update({
          ip_address: deviceData.ip_address,
          user_agent: deviceData.user_agent,
          browser: deviceData.browser,
          os: deviceData.os,
          device_type: deviceData.device_type,
          device_model: deviceData.device_model,
          location: deviceData.location,
          country: deviceData.country,
          city: deviceData.city,
          referrer: deviceData.referrer,
          screen_resolution: deviceData.screen_resolution,
          timezone: deviceData.timezone,
          language: deviceData.language,
          utm_source: deviceData.utm_source,
          utm_medium: deviceData.utm_medium,
          utm_campaign: deviceData.utm_campaign,
          utm_content: deviceData.utm_content,
          utm_term: deviceData.utm_term,
          facebook_ad_id: deviceData.facebook_ad_id,
          facebook_adset_id: deviceData.facebook_adset_id,
          facebook_campaign_id: deviceData.facebook_campaign_id,
          // 🆕 INCLUIR NOVOS CAMPOS NA ATUALIZAÇÃO
          source_id: deviceData.source_id,
          media_url: deviceData.media_url,
          ctwa_clid: deviceData.ctwa_clid,
        })
        .eq('phone', deviceData.phone)
        .select();
      
      if (error) {
        console.error('❌ Erro ao atualizar dados do dispositivo:', error);
        return null;
      }
      
      console.log('✅ Dados do dispositivo atualizados com sucesso');
      return data;
    } else {
      // Criar novos dados
      const { data, error } = await supabase
        .from('device_data')
        .insert({
          phone: deviceData.phone,
          ip_address: deviceData.ip_address,
          user_agent: deviceData.user_agent,
          browser: deviceData.browser,
          os: deviceData.os,
          device_type: deviceData.device_type,
          device_model: deviceData.device_model,
          location: deviceData.location,
          country: deviceData.country,
          city: deviceData.city,
          referrer: deviceData.referrer,
          screen_resolution: deviceData.screen_resolution,
          timezone: deviceData.timezone,
          language: deviceData.language,
          utm_source: deviceData.utm_source,
          utm_medium: deviceData.utm_medium,
          utm_campaign: deviceData.utm_campaign,
          utm_content: deviceData.utm_content,
          utm_term: deviceData.utm_term,
          facebook_ad_id: deviceData.facebook_ad_id,
          facebook_adset_id: deviceData.facebook_adset_id,
          facebook_campaign_id: deviceData.facebook_campaign_id,
          // 🆕 INCLUIR NOVOS CAMPOS NA INSERÇÃO
          source_id: deviceData.source_id,
          media_url: deviceData.media_url,
          ctwa_clid: deviceData.ctwa_clid,
        })
        .select();
      
      if (error) {
        console.error('❌ Erro ao salvar dados do dispositivo:', error);
        return null;
      }
      
      console.log('✅ Dados do dispositivo salvos com sucesso');
      return data;
    }
  } catch (error) {
    console.error('❌ Erro geral ao salvar dados do dispositivo:', error);
    return null;
  }
};

export const getDeviceDataByPhone = async (phone: string): Promise<DeviceDataCapture | null> => {
  try {
    console.log('🔍 Buscando dados do dispositivo para telefone:', phone);
    
    const { data, error } = await supabase
      .from('device_data')
      .select(`
        *,
        source_id,
        media_url,
        ctwa_clid
      `)
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      console.log('❌ Dados do dispositivo não encontrados:', error);
      return null;
    }
    
    console.log('✅ Dados do dispositivo encontrados com novos parâmetros:', {
      source_id: data.source_id,
      media_url: data.media_url,
      ctwa_clid: data.ctwa_clid,
      phone: data.phone
    });
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dispositivo:', error);
    return null;
  }
};

// Funções auxiliares
const getBrowserName = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
};

const getOperatingSystem = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac OS X')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

const getDeviceType = (userAgent: string): string => {
  if (/tablet|ipad/i.test(userAgent)) return 'tablet';
  if (/mobile|iphone|android/i.test(userAgent)) return 'mobile';
  return 'desktop';
};
