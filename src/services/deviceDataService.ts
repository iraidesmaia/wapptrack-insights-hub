
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
}

// Detectar informações do navegador e sistema operacional
export const getDeviceInfo = (): Partial<DeviceDataCapture> => {
  const userAgent = navigator.userAgent;
  
  // Detectar navegador
  let browser = 'Desconhecido';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // Detectar sistema operacional
  let os = 'Desconhecido';
  if (userAgent.includes('Windows NT 10.0')) os = 'Windows 10';
  else if (userAgent.includes('Windows NT 6.3')) os = 'Windows 8.1';
  else if (userAgent.includes('Windows NT 6.2')) os = 'Windows 8';
  else if (userAgent.includes('Windows NT 6.1')) os = 'Windows 7';
  else if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac OS X')) {
    const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  }
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) {
    const match = userAgent.match(/Android (\d+[._]\d+)/);
    os = match ? `Android ${match[1].replace('_', '.')}` : 'Android';
  }
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Detectar tipo de dispositivo
  let device_type = 'Desktop';
  let device_model = 'Desconhecido';
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    device_type = 'Tablet';
    if (userAgent.includes('iPad')) device_model = 'iPad';
  } else if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    device_type = 'Mobile';
    if (userAgent.includes('iPhone')) device_model = 'iPhone';
    else if (userAgent.includes('Samsung')) device_model = 'Samsung';
    else if (userAgent.includes('Xiaomi')) device_model = 'Xiaomi';
  }

  return {
    user_agent: userAgent,
    browser,
    os,
    device_type,
    device_model,
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    referrer: document.referrer
  };
};

// Obter IP público e localização
export const getLocationData = async (): Promise<Partial<DeviceDataCapture>> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      ip_address: data.ip,
      country: data.country_name,
      city: data.city,
      location: `${data.city}, ${data.region}, ${data.country_name}`
    };
  } catch (error) {
    console.error('Erro ao obter dados de localização:', error);
    return {
      ip_address: 'Não disponível',
      country: 'Brasil',
      city: 'Não disponível',
      location: 'Não disponível'
    };
  }
};

// Capturar todos os dados do dispositivo
export const captureDeviceData = async (phone?: string): Promise<DeviceDataCapture> => {
  const deviceInfo = getDeviceInfo();
  const locationData = await getLocationData();
  
  // Capturar UTMs da URL
  const urlParams = new URLSearchParams(window.location.search);
  const utmData = {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined
  };

  return {
    phone,
    ...deviceInfo,
    ...locationData,
    ...utmData
  };
};

// Salvar dados do dispositivo no banco de dados
export const saveDeviceData = async (deviceData: DeviceDataCapture) => {
  try {
    console.log('💾 Salvando dados do dispositivo no banco:', deviceData);
    
    const { error } = await supabase
      .from('device_data')
      .insert({
        phone: deviceData.phone || null,
        ip_address: deviceData.ip_address || null,
        user_agent: deviceData.user_agent || null,
        browser: deviceData.browser || null,
        os: deviceData.os || null,
        device_type: deviceData.device_type || null,
        device_model: deviceData.device_model || null,
        location: deviceData.location || null,
        country: deviceData.country || null,
        city: deviceData.city || null,
        referrer: deviceData.referrer || null,
        screen_resolution: deviceData.screen_resolution || null,
        timezone: deviceData.timezone || null,
        language: deviceData.language || null,
        utm_source: deviceData.utm_source || null,
        utm_medium: deviceData.utm_medium || null,
        utm_campaign: deviceData.utm_campaign || null,
        utm_content: deviceData.utm_content || null,
        utm_term: deviceData.utm_term || null
      });

    if (error) {
      console.error('❌ Erro ao salvar dados do dispositivo:', error);
      return { success: false, error };
    }

    console.log('✅ Dados do dispositivo salvos com sucesso no banco');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro geral ao salvar dados do dispositivo:', error);
    return { success: false, error };
  }
};

// Buscar dados do dispositivo por telefone
export const getDeviceDataByPhone = async (phone: string): Promise<DeviceDataCapture | null> => {
  try {
    console.log('🔍 Buscando dados do dispositivo para telefone:', phone);
    
    // Buscar dados do dispositivo salvos nas últimas 2 horas
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar dados do dispositivo:', error);
      return null;
    }

    if (data && data.length > 0) {
      const deviceInfo = data[0];
      console.log('✅ Dados do dispositivo encontrados:', {
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location
      });
      
      return {
        phone: deviceInfo.phone,
        ip_address: deviceInfo.ip_address,
        user_agent: deviceInfo.user_agent,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        device_type: deviceInfo.device_type,
        device_model: deviceInfo.device_model,
        location: deviceInfo.location,
        country: deviceInfo.country,
        city: deviceInfo.city,
        referrer: deviceInfo.referrer,
        screen_resolution: deviceInfo.screen_resolution,
        timezone: deviceInfo.timezone,
        language: deviceInfo.language,
        utm_source: deviceInfo.utm_source,
        utm_medium: deviceInfo.utm_medium,
        utm_campaign: deviceInfo.utm_campaign,
        utm_content: deviceInfo.utm_content,
        utm_term: deviceInfo.utm_term
      };
    }

    console.log('❌ Nenhum dado do dispositivo encontrado para:', phone);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar dados do dispositivo:', error);
    return null;
  }
};
