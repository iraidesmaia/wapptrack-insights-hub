
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

// Salvar dados do dispositivo no banco usando SQL direto
export const saveDeviceData = async (deviceData: DeviceDataCapture) => {
  try {
    // Usar raw SQL pois a tabela device_data não está nos tipos gerados
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO device_data (
          phone, ip_address, user_agent, browser, os, device_type, device_model,
          location, country, city, referrer, screen_resolution, timezone, language,
          utm_source, utm_medium, utm_campaign, utm_content, utm_term
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
      `,
      params: [
        deviceData.phone || null,
        deviceData.ip_address || null,
        deviceData.user_agent || null,
        deviceData.browser || null,
        deviceData.os || null,
        deviceData.device_type || null,
        deviceData.device_model || null,
        deviceData.location || null,
        deviceData.country || null,
        deviceData.city || null,
        deviceData.referrer || null,
        deviceData.screen_resolution || null,
        deviceData.timezone || null,
        deviceData.language || null,
        deviceData.utm_source || null,
        deviceData.utm_medium || null,
        deviceData.utm_campaign || null,
        deviceData.utm_content || null,
        deviceData.utm_term || null
      ]
    });

    if (error) {
      console.error('Erro ao salvar dados do dispositivo:', error);
      return { success: false, error };
    }

    console.log('Dados do dispositivo salvos com sucesso');
    return { success: true };
  } catch (error) {
    console.error('Erro geral ao salvar dados do dispositivo:', error);
    return { success: false, error };
  }
};

// Buscar dados do dispositivo por telefone usando SQL direto
export const getDeviceDataByPhone = async (phone: string): Promise<DeviceDataCapture | null> => {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT * FROM device_data 
        WHERE phone = $1 
        AND created_at >= NOW() - INTERVAL '2 hours'
        ORDER BY created_at DESC 
        LIMIT 1
      `,
      params: [phone]
    });

    if (error) {
      console.error('Erro ao buscar dados do dispositivo:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Erro geral ao buscar dados do dispositivo:', error);
    return null;
  }
};
