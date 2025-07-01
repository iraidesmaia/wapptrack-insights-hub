import { supabase } from '@/integrations/supabase/client';
import { collectUrlParameters, collectDeviceData } from '@/lib/dataCollection';
import { generateBrowserFingerprint, generateSessionId, getPublicIP } from './sessionTrackingService';

export interface CTWAClickData {
  // Dados básicos
  campaign_id: string;
  ctwa_clid: string;
  
  // Dados de rastreamento
  ip_address: string;
  user_agent: string;
  browser_fingerprint: string;
  session_id: string;
  
  // Device info
  device_type: string;
  browser: string;
  os: string;
  screen_resolution: string;
  language: string;
  timezone: string;
  
  // UTMs válidos
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  
  // Dados customizados
  source_id?: string;
  media_url?: string;
  
  // Context
  source_url: string;
  referrer: string;
  timestamp: string;
}

/**
 * Captura e salva todos os dados no momento do clique CTWA
 */
export const captureClickToWhatsAppData = async (campaignId: string): Promise<CTWAClickData | null> => {
  try {
    console.log('🎯 [CTWA TRACKER] Iniciando captura completa de dados do clique...');
    
    // 1. Coletar parâmetros da URL
    const { utm, tracking } = collectUrlParameters();
    
    // Verificar se tem ctwa_clid
    if (!tracking.ctwa_clid) {
      console.log('⚠️ [CTWA TRACKER] Clique sem ctwa_clid detectado');
      return null;
    }
    
    console.log('🎯 [CTWA TRACKER] CTWA_CLID detectado:', tracking.ctwa_clid);
    
    // 2. Coletar dados do dispositivo
    const deviceData = collectDeviceData();
    
    // 3. Gerar identificadores únicos
    const browserFingerprint = generateBrowserFingerprint();
    const sessionId = generateSessionId();
    const publicIP = await getPublicIP();
    
    // 4. Preparar dados consolidados
    const clickData: CTWAClickData = {
      campaign_id: campaignId,
      ctwa_clid: tracking.ctwa_clid,
      
      // Tracking identifiers
      ip_address: publicIP,
      user_agent: deviceData.userAgent,
      browser_fingerprint: browserFingerprint,
      session_id: sessionId,
      
      // Device info
      device_type: deviceData.deviceType,
      browser: deviceData.browserName,
      os: deviceData.operatingSystem,
      screen_resolution: deviceData.screenResolution,
      language: deviceData.language,
      timezone: deviceData.timezone,
      
      // UTMs válidos
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium, 
      utm_campaign: utm.utm_campaign,
      utm_content: utm.utm_content,
      utm_term: utm.utm_term,
      
      // Dados customizados
      source_id: tracking.source_id,
      media_url: tracking.media_url,
      
      // Context
      source_url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 [CTWA TRACKER] Dados consolidados preparados:', {
      ctwa_clid: clickData.ctwa_clid,
      campaign_id: clickData.campaign_id,
      ip_address: clickData.ip_address,
      device_type: clickData.device_type,
      utm_source: clickData.utm_source,
      source_id: clickData.source_id
    });
    
    // 5. Salvar na tabela de sessões de tracking
    const { error: trackingError } = await supabase
      .from('tracking_sessions')
      .insert({
        session_id: clickData.session_id,
        browser_fingerprint: clickData.browser_fingerprint,
        ip_address: clickData.ip_address,
        user_agent: clickData.user_agent,
        screen_resolution: clickData.screen_resolution,
        language: clickData.language,
        timezone: clickData.timezone,
        referrer: clickData.referrer,
        current_url: clickData.source_url,
        campaign_id: clickData.campaign_id,
        utm_source: clickData.utm_source,
        utm_medium: clickData.utm_medium,
        utm_campaign: clickData.utm_campaign,
        utm_content: clickData.utm_content,
        utm_term: clickData.utm_term,
        source_id: clickData.source_id,
        media_url: clickData.media_url,
        ctwa_clid: clickData.ctwa_clid
      });
    
    if (trackingError) {
      console.error('❌ [CTWA TRACKER] Erro ao salvar dados de tracking:', trackingError);
      return null;
    }
    
    // 6. Salvar também na tabela device_data para redundância e correlação
    const { error: deviceError } = await supabase
      .from('device_data')
      .insert({
        phone: 'PENDING_CTWA_' + clickData.ctwa_clid, // Temporário até receber mensagem
        ip_address: clickData.ip_address,
        user_agent: clickData.user_agent,
        browser: clickData.browser,
        os: clickData.os,
        device_type: clickData.device_type,
        screen_resolution: clickData.screen_resolution,
        timezone: clickData.timezone,
        language: clickData.language,
        referrer: clickData.referrer,
        utm_source: clickData.utm_source,
        utm_medium: clickData.utm_medium,
        utm_campaign: clickData.utm_campaign,
        utm_content: clickData.utm_content,
        utm_term: clickData.utm_term,
        source_id: clickData.source_id,
        media_url: clickData.media_url,
        ctwa_clid: clickData.ctwa_clid
      });
    
    if (deviceError) {
      console.warn('⚠️ [CTWA TRACKER] Erro ao salvar device data (não crítico):', deviceError);
    }
    
    // 7. Salvar no localStorage para acesso local
    localStorage.setItem('ctwa_click_data', JSON.stringify({
      ctwa_clid: clickData.ctwa_clid,
      campaign_id: clickData.campaign_id,
      session_id: clickData.session_id,
      browser_fingerprint: clickData.browser_fingerprint,
      timestamp: clickData.timestamp
    }));
    
    console.log('✅ [CTWA TRACKER] Dados do clique CTWA salvos com sucesso!');
    
    return clickData;
    
  } catch (error) {
    console.error('❌ [CTWA TRACKER] Erro geral na captura de dados:', error);
    return null;
  }
};

/**
 * Busca dados de clique CTWA por ctwa_clid para associação
 */
export const findCTWAClickData = async (ctwaCLid: string): Promise<CTWAClickData | null> => {
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
        device_type: session.screen_resolution ? 'desktop' : 'mobile', // Inferir do screen_resolution
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
export const updateCTWADeviceDataWithPhone = async (ctwaCLid: string, realPhone: string): Promise<boolean> => {
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