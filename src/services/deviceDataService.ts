
import { supabase } from "../integrations/supabase/client";

export interface DeviceDataResult {
  location?: string;
  ip_address?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  device_model?: string;
  country?: string;
  city?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export const getDeviceDataByPhone = async (phone: string): Promise<DeviceDataResult | null> => {
  try {
    console.log('🔍 Buscando dados do dispositivo para telefone:', phone);
    
    const { data, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('❌ Erro ao buscar dados do dispositivo:', error);
      return null;
    }

    if (data && data.length > 0) {
      const deviceData = data[0];
      console.log('✅ Dados do dispositivo encontrados:', {
        device_type: deviceData.device_type,
        browser: deviceData.browser,
        location: deviceData.location
      });
      
      return {
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
        utm_source: deviceData.utm_source,
        utm_medium: deviceData.utm_medium,
        utm_campaign: deviceData.utm_campaign,
        utm_content: deviceData.utm_content,
        utm_term: deviceData.utm_term
      };
    }

    console.log('❌ Nenhum dado do dispositivo encontrado para:', phone);
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar dados do dispositivo:', error);
    return null;
  }
};

export const saveDeviceData = async (
  phone: string,
  deviceData: DeviceDataResult
): Promise<boolean> => {
  try {
    console.log('💾 Salvando dados do dispositivo para:', phone);
    
    const { error } = await supabase
      .from('device_data')
      .insert({
        phone,
        ...deviceData,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('❌ Erro ao salvar dados do dispositivo:', error);
      return false;
    }

    console.log('✅ Dados do dispositivo salvos com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro geral ao salvar dados do dispositivo:', error);
    return false;
  }
};
