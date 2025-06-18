
import { supabase } from '@/integrations/supabase/client';

// Gerar um fingerprint único do navegador
export const generateBrowserFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'top';
  ctx.font = '14px Arial';
  ctx.fillText('Browser fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    navigator.platform,
    navigator.cookieEnabled,
    localStorage.length,
    sessionStorage.length
  ].join('|');
  
  // Criar hash simples
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// Gerar session ID único
export const generateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('tracking_session_id');
  if (!sessionId) {
    sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    sessionStorage.setItem('tracking_session_id', sessionId);
  }
  return sessionId;
};

// Obter IP público
export const getPublicIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('Não foi possível obter IP público:', error);
    return 'unknown';
  }
};

// Salvar dados de tracking com identificadores únicos
export const saveTrackingData = async (utms: any, campaignId: string) => {
  try {
    console.log('💾 Salvando dados de tracking com identificadores únicos...');
    
    const sessionId = generateSessionId();
    const browserFingerprint = generateBrowserFingerprint();
    const publicIP = await getPublicIP();
    
    const trackingData = {
      session_id: sessionId,
      browser_fingerprint: browserFingerprint,
      ip_address: publicIP,
      user_agent: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      referrer: document.referrer,
      current_url: window.location.href,
      campaign_id: campaignId,
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term
    };
    
    console.log('📊 Dados de tracking preparados:', {
      session_id: sessionId,
      browser_fingerprint: browserFingerprint,
      ip_address: publicIP,
      campaign_id: campaignId,
      utm_campaign: utms.utm_campaign
    });
    
    // Inserir diretamente na tabela tracking_sessions
    const { error } = await supabase
      .from('tracking_sessions')
      .insert({
        session_id: trackingData.session_id,
        browser_fingerprint: trackingData.browser_fingerprint,
        ip_address: trackingData.ip_address,
        user_agent: trackingData.user_agent,
        screen_resolution: trackingData.screen_resolution,
        language: trackingData.language,
        timezone: trackingData.timezone,
        referrer: trackingData.referrer,
        current_url: trackingData.current_url,
        campaign_id: trackingData.campaign_id,
        utm_source: trackingData.utm_source,
        utm_medium: trackingData.utm_medium,
        utm_campaign: trackingData.utm_campaign,
        utm_content: trackingData.utm_content,
        utm_term: trackingData.utm_term
      });
    
    if (error) {
      console.error('❌ Erro ao salvar dados de tracking:', error);
      return { success: false, error };
    }
    
    console.log('✅ Dados de tracking salvos com identificadores únicos');
    
    // Também salvar no localStorage para redundância
    localStorage.setItem('last_tracking_data', JSON.stringify({
      session_id: sessionId,
      browser_fingerprint: browserFingerprint,
      campaign_id: campaignId,
      utm_campaign: utms.utm_campaign,
      timestamp: Date.now()
    }));
    
    return { 
      success: true, 
      session_id: sessionId,
      browser_fingerprint: browserFingerprint 
    };
  } catch (error) {
    console.error('❌ Erro geral ao salvar tracking:', error);
    return { success: false, error };
  }
};

// Buscar dados de tracking por identificadores
export const getTrackingDataByIdentifiers = async (phone: string) => {
  try {
    console.log('🔍 Buscando dados de tracking por identificadores para:', phone);
    
    // Tentar obter dados atuais do dispositivo para correlação
    const currentBrowserFingerprint = generateBrowserFingerprint();
    const currentSessionId = generateSessionId();
    const currentIP = await getPublicIP();
    
    console.log('🔍 Identificadores atuais:', {
      browser_fingerprint: currentBrowserFingerprint,
      session_id: currentSessionId,
      ip_address: currentIP
    });
    
    // Buscar nas últimas 4 horas
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    
    // Buscar por fingerprint, session ou IP usando query direta
    const { data: trackingData, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .gte('created_at', fourHoursAgo)
      .or(`browser_fingerprint.eq.${currentBrowserFingerprint},session_id.eq.${currentSessionId},ip_address.eq.${currentIP}`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('❌ Erro ao buscar tracking data:', error);
      return null;
    }
    
    if (trackingData && trackingData.length > 0) {
      const session = trackingData[0];
      console.log('✅ Dados de tracking encontrados:', {
        campaign_id: session.campaign_id,
        utm_campaign: session.utm_campaign,
        match_type: session.browser_fingerprint === currentBrowserFingerprint ? 'fingerprint' : 
                   session.session_id === currentSessionId ? 'session' : 'ip'
      });
      
      return session;
    }
    
    console.log('❌ Nenhum dado de tracking encontrado para os identificadores atuais');
    return null;
  } catch (error) {
    console.error('❌ Erro geral ao buscar tracking data:', error);
    return null;
  }
};
