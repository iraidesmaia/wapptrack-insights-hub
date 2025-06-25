
// Handler para buscar dados de tracking por identificadores de sessão com algoritmo melhorado
export const getTrackingDataBySession = async (supabase: any, deviceData: any): Promise<{
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  match_type?: string;
  confidence_score?: number;
} | null> => {
  try {
    console.log('🔍 [CORRELAÇÃO MELHORADA] Iniciando busca por identificadores de sessão...');
    
    if (!deviceData) {
      console.log('❌ [CORRELAÇÃO] Nenhum dado do dispositivo disponível para correlação');
      return null;
    }
    
    // Gerar fingerprint a partir dos dados do dispositivo disponíveis
    const browserFingerprint = generateServerBrowserFingerprint(deviceData);
    
    console.log('🔍 [CORRELAÇÃO] Tentando correlacionar com:', {
      ip_address: deviceData.ip_address,
      user_agent: deviceData.user_agent?.substring(0, 50) + '...',
      browser_fingerprint: browserFingerprint,
      phone: deviceData.phone || 'N/A',
      timestamp: new Date().toISOString()
    });
    
    // Buscar nas últimas 6 horas (aumentado de 4 para 6)
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    
    let trackingData = null;
    let matchType = 'unknown';
    let confidenceScore = 0;
    
    // MÉTODO 1: Busca por IP + parcial do User Agent (mais confiável)
    if (deviceData.ip_address && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO] Método 1: Buscando por IP + User Agent...');
      
      // Extrair partes do User Agent para busca parcial
      const userAgentParts = deviceData.user_agent.split(' ').slice(0, 3).join(' ');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .ilike('user_agent', `%${userAgentParts}%`)
        .gte('created_at', sixHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        trackingData = data;
        matchType = 'ip_user_agent';
        confidenceScore = 90;
        console.log('✅ [CORRELAÇÃO] Método 1 - Encontrado por IP + User Agent:', {
          campaign_id: trackingData[0].campaign_id,
          matches_found: data.length,
          confidence: confidenceScore
        });
      }
    }
    
    // MÉTODO 2: Busca por IP + timezone (segunda opção mais confiável)
    if ((!trackingData || trackingData.length === 0) && deviceData.ip_address && deviceData.timezone) {
      console.log('🔍 [CORRELAÇÃO] Método 2: Buscando por IP + Timezone...');
      
      const { data: timezoneData, error: timezoneError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .gte('created_at', sixHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!timezoneError && timezoneData && timezoneData.length > 0) {
        trackingData = timezoneData;
        matchType = 'ip_timezone';
        confidenceScore = 80;
        console.log('✅ [CORRELAÇÃO] Método 2 - Encontrado por IP + Timezone:', {
          campaign_id: trackingData[0].campaign_id,
          matches_found: timezoneData.length,
          confidence: confidenceScore
        });
      }
    }
    
    // MÉTODO 3: Busca apenas por IP (menos confiável)
    if ((!trackingData || trackingData.length === 0) && deviceData.ip_address) {
      console.log('🔍 [CORRELAÇÃO] Método 3: Buscando apenas por IP...');
      
      const { data: ipData, error: ipError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', sixHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!ipError && ipData && ipData.length > 0) {
        trackingData = ipData;
        matchType = 'ip_only';
        confidenceScore = 60;
        console.log('✅ [CORRELAÇÃO] Método 3 - Encontrado apenas por IP:', {
          campaign_id: trackingData[0].campaign_id,
          matches_found: ipData.length,
          confidence: confidenceScore
        });
      }
    }
    
    // MÉTODO 4: Busca por fingerprint se disponível
    if ((!trackingData || trackingData.length === 0) && browserFingerprint) {
      console.log('🔍 [CORRELAÇÃO] Método 4: Buscando por browser fingerprint...');
      
      const { data: fingerprintData, error: fingerprintError } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('browser_fingerprint', browserFingerprint)
        .gte('created_at', sixHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!fingerprintError && fingerprintData && fingerprintData.length > 0) {
        trackingData = fingerprintData;
        matchType = 'fingerprint';
        confidenceScore = 70;
        console.log('✅ [CORRELAÇÃO] Método 4 - Encontrado por fingerprint:', {
          campaign_id: trackingData[0].campaign_id,
          matches_found: fingerprintData.length,
          confidence: confidenceScore
        });
      }
    }
    
    if (trackingData && trackingData.length > 0) {
      const session = trackingData[0];
      
      // Calcular tempo entre criação da sessão e mensagem WhatsApp
      const sessionTime = new Date(session.created_at).getTime();
      const currentTime = Date.now();
      const timeDiffMinutes = (currentTime - sessionTime) / (1000 * 60);
      
      // Ajustar score de confiança baseado no tempo
      if (timeDiffMinutes < 5) {
        confidenceScore += 10; // Bonus para correlações muito recentes
      } else if (timeDiffMinutes > 60) {
        confidenceScore -= 20; // Penalidade para correlações antigas
      }
      
      console.log('🎯 [CORRELAÇÃO] SUCESSO - Dados encontrados:', {
        campaign_id: session.campaign_id,
        utm_campaign: session.utm_campaign,
        utm_source: session.utm_source,
        match_type: matchType,
        confidence_score: confidenceScore,
        time_diff_minutes: timeDiffMinutes.toFixed(1),
        created_at: session.created_at
      });
      
      return {
        campaign_id: session.campaign_id,
        utm_source: session.utm_source,
        utm_medium: session.utm_medium,
        utm_campaign: session.utm_campaign,
        utm_content: session.utm_content,
        utm_term: session.utm_term,
        match_type: matchType,
        confidence_score: confidenceScore
      };
    }
    
    console.log('❌ [CORRELAÇÃO] Nenhum dado de tracking encontrado via correlação');
    return null;
  } catch (error) {
    console.error('❌ [CORRELAÇÃO] Erro geral ao buscar tracking por sessão:', error);
    return null;
  }
};

// Gerar fingerprint do lado do servidor baseado nos dados disponíveis (melhorado)
const generateServerBrowserFingerprint = (deviceData: any): string | null => {
  if (!deviceData.user_agent) return null;
  
  try {
    const fingerprint = [
      deviceData.user_agent,
      deviceData.language || 'unknown',
      deviceData.screen_resolution || 'unknown',
      deviceData.timezone || 'unknown',
      deviceData.ip_address || 'unknown'
    ].join('|');
    
    // Criar hash simples mais robusto
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error('❌ [CORRELAÇÃO] Erro ao gerar fingerprint do servidor:', error);
    return null;
  }
};
