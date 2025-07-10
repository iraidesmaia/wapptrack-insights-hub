import { supabase } from '../integrations/supabase/client';

export interface DeviceDataCapture {
  ip_address: string;
  user_agent: string;
  browser: string;
  os: string;
  device_type: string;
  device_model: string;
  location: string;
  country: string;
  city: string;
  screen_resolution: string;
  timezone: string;
  language: string;
  referrer: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  // 🎯 PARÂMETROS DO FACEBOOK ADS (SUPORTE A AMBOS OS FORMATOS)
  facebook_ad_id?: string;
  facebook_adset_id?: string;
  facebook_campaign_id?: string;
}

// 🎯 FUNÇÃO ATUALIZADA PARA EXTRAIR PARÂMETROS (AMBOS FORMATOS)
const extractFacebookAdsParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Priorizar parâmetros sem prefixo, depois com prefixo
  const getFacebookAdId = () => urlParams.get('ad_id') || urlParams.get('facebook_ad_id') || '';
  const getFacebookAdsetId = () => urlParams.get('adset_id') || urlParams.get('facebook_adset_id') || '';
  const getFacebookCampaignId = () => urlParams.get('campaign_id') || urlParams.get('facebook_campaign_id') || '';

  console.log('🎯 Parâmetros Facebook capturados:', {
    ad_id_found: urlParams.get('ad_id'),
    facebook_ad_id_found: urlParams.get('facebook_ad_id'),
    final_ad_id: getFacebookAdId(),
    adset_id_found: urlParams.get('adset_id'),
    facebook_adset_id_found: urlParams.get('facebook_adset_id'),
    final_adset_id: getFacebookAdsetId(),
    campaign_id_found: urlParams.get('campaign_id'),
    facebook_campaign_id_found: urlParams.get('facebook_campaign_id'),
    final_campaign_id: getFacebookCampaignId()
  });
  
  return {
    facebook_ad_id: getFacebookAdId(),
    facebook_adset_id: getFacebookAdsetId(),
    facebook_campaign_id: getFacebookCampaignId()
  };
};

// 🎯 FUNÇÃO PARA EXTRAIR UTMs DA URL
const extractUtmParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || '',
    utm_medium: urlParams.get('utm_medium') || '',
    utm_campaign: urlParams.get('utm_campaign') || '',
    utm_content: urlParams.get('utm_content') || '',
    utm_term: urlParams.get('utm_term') || ''
  };
};

export const captureDeviceData = async (phone?: string): Promise<DeviceDataCapture> => {
  // Capturar dados básicos do dispositivo
  const data: DeviceDataCapture = {
    ip_address: '',
    user_agent: navigator.userAgent,
    browser: getBrowserName(),
    os: getOperatingSystem(),
    device_type: getDeviceType(),
    device_model: getDeviceModel(),
    location: await getLocationInfo(),
    country: '',
    city: '',
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    referrer: document.referrer,
    // Capturar UTMs da URL atual
    ...extractUtmParams(),
    // 🎯 CAPTURAR PARÂMETROS DO FACEBOOK ADS (AMBOS FORMATOS)
    ...extractFacebookAdsParams()
  };

  // Tentar obter IP público
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    data.ip_address = ipData.ip;
  } catch {
    data.ip_address = 'N/A';
  }

  // Tentar obter informações de localização por IP
  try {
    const locationResponse = await fetch(`https://ipapi.co/${data.ip_address}/json/`);
    const locationData = await locationResponse.json();
    data.country = locationData.country_name || '';
    data.city = locationData.city || '';
    data.location = `${data.city}, ${data.country}`.replace(/^,\s*|,\s*$/g, '');
  } catch {
    data.country = '';
    data.city = '';
  }

  console.log('📱 Dados do dispositivo capturados (suporte a ambos formatos Facebook):', {
    device_type: data.device_type,
    facebook_ad_id: data.facebook_ad_id,
    facebook_adset_id: data.facebook_adset_id,
    facebook_campaign_id: data.facebook_campaign_id,
    utm_campaign: data.utm_campaign,
    phone: phone
  });

  return data;
};

export const saveDeviceData = async (deviceData: DeviceDataCapture & { phone?: string }) => {
  try {
    if (!deviceData.phone) {
      console.log('📱 Sem telefone fornecido, não salvando dados do dispositivo');
      return null;
    }

    console.log('💾 Salvando dados do dispositivo com parâmetros Facebook (ambos formatos):', {
      phone: deviceData.phone,
      facebook_ad_id: deviceData.facebook_ad_id,
      facebook_adset_id: deviceData.facebook_adset_id,
      facebook_campaign_id: deviceData.facebook_campaign_id
    });

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
        // 🎯 SALVAR PARÂMETROS DO FACEBOOK ADS
        facebook_ad_id: deviceData.facebook_ad_id,
        facebook_adset_id: deviceData.facebook_adset_id,
        facebook_campaign_id: deviceData.facebook_campaign_id
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Dados do dispositivo salvos com parâmetros Facebook (ambos formatos):', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao salvar dados do dispositivo:', error);
    return null;
  }
};

export const getDeviceDataByPhone = async (phone: string) => {
  try {
    const { data, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do dispositivo:', error);
    return null;
  }
};

// Helper functions to get device information
const getBrowserName = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera') || userAgent.includes('OPR')) return 'Opera';
  
  return 'Outro';
};

const getOperatingSystem = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';
  
  return 'Outro';
};

const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
    return 'Mobile';
  }
  if (/iPad|Android(?!.*Mobile)/i.test(userAgent)) {
    return 'Tablet';
  }
  
  return 'Desktop';
};

const getDeviceModel = (): string => {
  const userAgent = navigator.userAgent;
  
  // Tentar extrair modelo do dispositivo
  const iphoneMatch = userAgent.match(/iPhone\s+OS\s+([\d_]+)/);
  if (iphoneMatch) return `iPhone (iOS ${iphoneMatch[1].replace(/_/g, '.')})`;
  
  const androidMatch = userAgent.match(/Android\s+([\d.]+)/);
  if (androidMatch) return `Android ${androidMatch[1]}`;
  
  return 'N/A';
};

const getLocationInfo = async (): Promise<string> => {
  try {
    if ('geolocation' in navigator) {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(`${position.coords.latitude}, ${position.coords.longitude}`);
          },
          () => {
            resolve('N/A');
          },
          { timeout: 5000 }
        );
      });
    }
  } catch {
    // Fallback silencioso
  }
  
  return 'N/A';
};
