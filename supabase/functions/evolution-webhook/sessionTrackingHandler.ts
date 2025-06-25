
// Handler para buscar dados de tracking por identificadores de sessão com algoritmo melhorado e otimizado
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
    console.log('🔍 [CORRELAÇÃO MELHORADA V2] Iniciando busca por identificadores de sessão...');
    
    if (!deviceData) {
      console.log('❌ [CORRELAÇÃO] Nenhum dado do dispositivo disponível para correlação');
      return null;
    }
    
    console.log('🔍 [CORRELAÇÃO] Tentando correlacionar com dados:', {
      ip_address: deviceData.ip_address,
      user_agent: deviceData.user_agent?.substring(0, 50) + '...',
      phone: deviceData.phone || 'N/A',
      timestamp: new Date().toISOString()
    });
    
    // EXPANSÃO: Buscar nas últimas 24 horas (aumentado de 6 para 24)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let bestMatch = null;
    let bestScore = 0;
    let bestMatchType = 'unknown';
    
    // MÉTODO 1: IP + User Agent completo (mais confiável - 95%)
    if (deviceData.ip_address && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO] Método 1: Buscando por IP + User Agent completo...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('user_agent', deviceData.user_agent)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const score = 95;
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        
        // Bonus por tempo recente
        const finalScore = timeDiff < 10 ? score + 5 : score;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = match;
          bestMatchType = 'ip_user_agent_exact';
          console.log('✅ [CORRELAÇÃO] Método 1 - Match exato encontrado:', {
            campaign_id: match.campaign_id,
            confidence: finalScore,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 2: IP + Parcial do User Agent (85%)
    if ((!bestMatch || bestScore < 90) && deviceData.ip_address && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO] Método 2: Buscando por IP + User Agent parcial...');
      
      // Extrair partes mais significativas do User Agent
      const userAgentCore = deviceData.user_agent.split(' ').slice(0, 4).join(' ');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .ilike('user_agent', `%${userAgentCore}%`)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const score = 85;
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        
        // Bonus por tempo recente
        const finalScore = timeDiff < 10 ? score + 5 : score;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = match;
          bestMatchType = 'ip_user_agent_partial';
          console.log('✅ [CORRELAÇÃO] Método 2 - Match parcial encontrado:', {
            campaign_id: match.campaign_id,
            confidence: finalScore,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 3: IP + Timezone + Screen Resolution (80%)
    if ((!bestMatch || bestScore < 80) && deviceData.ip_address && deviceData.timezone && deviceData.screen_resolution) {
      console.log('🔍 [CORRELAÇÃO] Método 3: Buscando por IP + Timezone + Screen...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .eq('screen_resolution', deviceData.screen_resolution)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const score = 80;
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        
        // Bonus por tempo recente
        const finalScore = timeDiff < 15 ? score + 5 : score;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = match;
          bestMatchType = 'ip_timezone_screen';
          console.log('✅ [CORRELAÇÃO] Método 3 - Match triplo encontrado:', {
            campaign_id: match.campaign_id,
            confidence: finalScore,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 4: IP + Timezone (75%)
    if ((!bestMatch || bestScore < 75) && deviceData.ip_address && deviceData.timezone) {
      console.log('🔍 [CORRELAÇÃO] Método 4: Buscando por IP + Timezone...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const score = 75;
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        
        // Bonus por tempo recente
        const finalScore = timeDiff < 20 ? score + 5 : score;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = match;
          bestMatchType = 'ip_timezone';
          console.log('✅ [CORRELAÇÃO] Método 4 - Match duplo encontrado:', {
            campaign_id: match.campaign_id,
            confidence: finalScore,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 5: IP + Language + Browser (70%)
    if ((!bestMatch || bestScore < 70) && deviceData.ip_address && deviceData.language && deviceData.browser) {
      console.log('🔍 [CORRELAÇÃO] Método 5: Buscando por IP + Language + Browser...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('language', deviceData.language)
        .ilike('user_agent', `%${deviceData.browser}%`)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const score = 70;
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        
        // Bonus por tempo recente
        const finalScore = timeDiff < 30 ? score + 5 : score;
        
        if (finalScore > bestScore) {
          bestScore = finalScore;
          bestMatch = match;
          bestMatchType = 'ip_language_browser';
          console.log('✅ [CORRELAÇÃO] Método 5 - Match contextual encontrado:', {
            campaign_id: match.campaign_id,
            confidence: finalScore,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 6: Apenas IP com scoring inteligente (60-65%)
    if ((!bestMatch || bestScore < 65) && deviceData.ip_address) {
      console.log('🔍 [CORRELAÇÃO] Método 6: Buscando apenas por IP com scoring...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data && data.length > 0) {
        // Escolher o mais recente com UTMs de campanha paga
        for (const session of data) {
          const timeDiff = (Date.now() - new Date(session.created_at).getTime()) / (1000 * 60);
          
          // Priorizar sessões com UTMs de tráfego pago
          const isPaidTraffic = session.utm_medium && 
            (session.utm_medium.includes('cpc') || 
             session.utm_medium.includes('paid') || 
             session.utm_source.includes('facebook') || 
             session.utm_source.includes('google'));
          
          let score = 60;
          if (isPaidTraffic) score += 5;
          if (timeDiff < 60) score += 3;
          if (timeDiff < 30) score += 2;
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = session;
            bestMatchType = 'ip_only_smart';
            console.log('✅ [CORRELAÇÃO] Método 6 - Match inteligente por IP:', {
              campaign_id: session.campaign_id,
              confidence: score,
              time_diff_minutes: timeDiff.toFixed(1),
              is_paid_traffic: isPaidTraffic
            });
            break; // Pegar o primeiro (mais recente) que atende aos critérios
          }
        }
      }
    }
    
    // MÉTODO 7: Browser Fingerprint se disponível (75%)
    if ((!bestMatch || bestScore < 75) && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO] Método 7: Buscando por Browser Fingerprint...');
      
      const browserFingerprint = generateServerBrowserFingerprint(deviceData);
      
      if (browserFingerprint) {
        const { data, error } = await supabase
          .from('tracking_sessions')
          .select('*')
          .eq('browser_fingerprint', browserFingerprint)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (!error && data && data.length > 0) {
          const match = data[0];
          const score = 75;
          const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
          
          // Bonus por tempo recente
          const finalScore = timeDiff < 20 ? score + 5 : score;
          
          if (finalScore > bestScore) {
            bestScore = finalScore;
            bestMatch = match;
            bestMatchType = 'fingerprint';
            console.log('✅ [CORRELAÇÃO] Método 7 - Match por fingerprint:', {
              campaign_id: match.campaign_id,
              confidence: finalScore,
              time_diff_minutes: timeDiff.toFixed(1)
            });
          }
        }
      }
    }
    
    if (bestMatch && bestScore >= 60) {
      // Ajustar score final baseado em fatores adicionais
      const sessionTime = new Date(bestMatch.created_at).getTime();
      const currentTime = Date.now();
      const timeDiffMinutes = (currentTime - sessionTime) / (1000 * 60);
      
      // Penalidade por tempo muito antigo
      if (timeDiffMinutes > 12 * 60) { // Mais de 12 horas
        bestScore -= 10;
      } else if (timeDiffMinutes > 6 * 60) { // Mais de 6 horas
        bestScore -= 5;
      }
      
      // Bonus para campanhas com UTMs completos
      if (bestMatch.utm_source && bestMatch.utm_medium && bestMatch.utm_campaign) {
        bestScore += 3;
      }
      
      // Garantir que não ultrapasse 100
      bestScore = Math.min(bestScore, 100);
      
      console.log('🎯 [CORRELAÇÃO V2] SUCESSO - Melhor match encontrado:', {
        campaign_id: bestMatch.campaign_id,
        utm_campaign: bestMatch.utm_campaign,
        utm_source: bestMatch.utm_source,
        utm_medium: bestMatch.utm_medium,
        match_type: bestMatchType,
        confidence_score: bestScore,
        time_diff_minutes: timeDiffMinutes.toFixed(1),
        created_at: bestMatch.created_at
      });
      
      return {
        campaign_id: bestMatch.campaign_id,
        utm_source: bestMatch.utm_source,
        utm_medium: bestMatch.utm_medium,
        utm_campaign: bestMatch.utm_campaign,
        utm_content: bestMatch.utm_content,
        utm_term: bestMatch.utm_term,
        match_type: bestMatchType,
        confidence_score: bestScore
      };
    }
    
    console.log('❌ [CORRELAÇÃO V2] Nenhum match encontrado com confiança suficiente (mín. 60%)');
    return null;
  } catch (error) {
    console.error('❌ [CORRELAÇÃO V2] Erro geral ao buscar tracking por sessão:', error);
    return null;
  }
};

// Gerar fingerprint do lado do servidor baseado nos dados disponíveis (otimizado)
const generateServerBrowserFingerprint = (deviceData: any): string | null => {
  if (!deviceData.user_agent) return null;
  
  try {
    const fingerprint = [
      deviceData.user_agent,
      deviceData.language || 'unknown',
      deviceData.screen_resolution || 'unknown',
      deviceData.timezone || 'unknown',
      deviceData.ip_address || 'unknown',
      deviceData.browser || 'unknown',
      deviceData.os || 'unknown'
    ].join('|');
    
    // Criar hash mais robusto
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
