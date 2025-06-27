// Handler para buscar dados de tracking por identificadores de sessão com algoritmo melhorado V3
export const getTrackingDataBySession = async (supabase: any, deviceData: any, leadCreatedAt?: string): Promise<{
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
    console.log('🔍 [CORRELAÇÃO V3] Iniciando busca por identificadores de sessão...');
    
    if (!deviceData) {
      console.log('❌ [CORRELAÇÃO V3] Nenhum dado do dispositivo disponível para correlação');
      return null;
    }
    
    console.log('🔍 [CORRELAÇÃO V3] Tentando correlacionar com dados:', {
      ip_address: deviceData.ip_address,
      user_agent: deviceData.user_agent?.substring(0, 50) + '...',
      phone: deviceData.phone || 'N/A',
      leadCreatedAt: leadCreatedAt || 'N/A',
      timestamp: new Date().toISOString()
    });
    
    // ALGORITMO V3: Janela temporal inteligente baseada no horário do lead
    const leadTime = leadCreatedAt ? new Date(leadCreatedAt).getTime() : Date.now();
    
    // Janela primária: ±30 minutos do horário do lead
    const thirtyMinutesAgo = new Date(leadTime - 30 * 60 * 1000).toISOString();
    const thirtyMinutesAfter = new Date(leadTime + 30 * 60 * 1000).toISOString();
    
    // Janela secundária: ±2 horas para casos de delay
    const twoHoursAgo = new Date(leadTime - 2 * 60 * 60 * 1000).toISOString();
    const twoHoursAfter = new Date(leadTime + 2 * 60 * 60 * 1000).toISOString();
    
    let bestMatch = null;
    let bestScore = 0;
    let bestMatchType = 'unknown';
    
    console.log('🕐 [CORRELAÇÃO V3] Janelas temporais:', {
      leadTime: new Date(leadTime).toISOString(),
      primaryWindow: `${thirtyMinutesAgo} - ${thirtyMinutesAfter}`,
      secondaryWindow: `${twoHoursAgo} - ${twoHoursAfter}`
    });
    
    // MÉTODO 1: IP + User Agent completo na janela primária (95-100%)
    if (deviceData.ip_address && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO V3] Método 1: Buscando por IP + User Agent na janela primária...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('user_agent', deviceData.user_agent)
        .gte('created_at', thirtyMinutesAgo)
        .lte('created_at', thirtyMinutesAfter)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const timeDiff = Math.abs(leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
        
        let score = 95;
        
        // Bonus por proximidade temporal
        if (timeDiff < 5) score += 5;
        else if (timeDiff < 15) score += 3;
        
        // Bonus por tráfego pago
        const isPaidTraffic = match.utm_medium && 
          (match.utm_medium.includes('cpc') || 
           match.utm_medium.includes('paid') || 
           match.utm_source?.includes('facebook') || 
           match.utm_source?.includes('instagram'));
        
        if (isPaidTraffic) score += 2;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
          bestMatchType = 'ip_user_agent_primary';
          console.log('✅ [CORRELAÇÃO V3] Método 1 - Match exato encontrado:', {
            campaign_id: match.campaign_id,
            confidence: score,
            time_diff_minutes: timeDiff.toFixed(1),
            utm_source: match.utm_source
          });
        }
      }
    }
    
    // MÉTODO 2: Facebook/Instagram prioritário na janela secundária (85-90%)
    if ((!bestMatch || bestScore < 85)) {
      console.log('🔍 [CORRELAÇÃO V3] Método 2: Buscando por redes sociais...');
      
      let query = supabase.from('tracking_sessions').select('*');
      
      if (deviceData.ip_address) {
        query = query.eq('ip_address', deviceData.ip_address);
      }
      
      const { data, error } = await query
        .gte('created_at', twoHoursAgo)
        .lte('created_at', twoHoursAfter)
        .or('utm_source.ilike.%facebook%,utm_source.ilike.%instagram%,utm_content.ilike.%fbclid%')
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const timeDiff = Math.abs(leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
        
        let score = 85;
        
        // Bonus alto para redes sociais
        if (match.utm_source?.includes('facebook') || match.utm_source?.includes('instagram')) {
          score += 3;
        }
        
        // Bonus por fbclid
        if (match.utm_content?.includes('fbclid')) {
          score += 2;
        }
        
        // Bonus por proximidade temporal
        if (timeDiff < 30) score += 3;
        else if (timeDiff < 60) score += 1;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
          bestMatchType = 'social_media_priority';
          console.log('✅ [CORRELAÇÃO V3] Método 2 - Match social encontrado:', {
            campaign_id: match.campaign_id,
            confidence: score,
            time_diff_minutes: timeDiff.toFixed(1),
            utm_source: match.utm_source,
            has_fbclid: match.utm_content?.includes('fbclid')
          });
        }
      }
    }
    
    // MÉTODO 3: IP + Parcial do User Agent na janela primária (85-90%)
    if ((!bestMatch || bestScore < 85) && deviceData.ip_address && deviceData.user_agent) {
      console.log('🔍 [CORRELAÇÃO V3] Método 3: Buscando por IP + User Agent parcial...');
      
      const userAgentCore = deviceData.user_agent.split(' ').slice(0, 4).join(' ');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .ilike('user_agent', `%${userAgentCore}%`)
        .gte('created_at', thirtyMinutesAgo)
        .lte('created_at', thirtyMinutesAfter)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const timeDiff = Math.abs(leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
        
        let score = 85;
        if (timeDiff < 10) score += 3;
        else if (timeDiff < 20) score += 1;
        
        const isPaidTraffic = match.utm_medium && 
          (match.utm_medium.includes('cpc') || 
           match.utm_source?.includes('facebook') || 
           match.utm_source?.includes('instagram'));
        
        if (isPaidTraffic) score += 2;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
          bestMatchType = 'ip_user_agent_partial_primary';
          console.log('✅ [CORRELAÇÃO V3] Método 3 - Match parcial encontrado:', {
            campaign_id: match.campaign_id,
            confidence: score,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 4: IP + Timezone + Screen Resolution na janela secundária (80-85%)
    if ((!bestMatch || bestScore < 80) && deviceData.ip_address && deviceData.timezone && deviceData.screen_resolution) {
      console.log('🔍 [CORRELAÇÃO V3] Método 4: Buscando por IP + Timezone + Screen...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .eq('screen_resolution', deviceData.screen_resolution)
        .gte('created_at', twoHoursAgo)
        .lte('created_at', twoHoursAfter)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (!error && data && data.length > 0) {
        const match = data[0];
        const timeDiff = Math.abs(leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
        
        let score = 80;
        if (timeDiff < 15) score += 3;
        else if (timeDiff < 30) score += 1;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
          bestMatchType = 'ip_timezone_screen_secondary';
          console.log('✅ [CORRELAÇÃO V3] Método 4 - Match triplo encontrado:', {
            campaign_id: match.campaign_id,
            confidence: score,
            time_diff_minutes: timeDiff.toFixed(1)
          });
        }
      }
    }
    
    // MÉTODO 5: Apenas IP com scoring inteligente (70-75%)
    if ((!bestMatch || bestScore < 70) && deviceData.ip_address) {
      console.log('🔍 [CORRELAÇÃO V3] Método 5: Buscando apenas por IP com scoring...');
      
      const { data, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', twoHoursAgo)
        .lte('created_at', twoHoursAfter)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (!error && data && data.length > 0) {
        // Priorizar sessões de tráfego pago
        const paidSessions = data.filter(s => 
          s.utm_medium && 
          (s.utm_medium.includes('cpc') || 
           s.utm_medium.includes('paid') || 
           s.utm_source?.includes('facebook') || 
           s.utm_source?.includes('instagram'))
        );
        
        const targetSessions = paidSessions.length > 0 ? paidSessions : data;
        const match = targetSessions[0];
        
        const timeDiff = Math.abs(leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
        
        let score = 70;
        
        // Bonus por tráfego pago
        if (paidSessions.includes(match)) score += 3;
        
        // Bonus por proximidade temporal
        if (timeDiff < 30) score += 3;
        else if (timeDiff < 60) score += 1;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = match;
          bestMatchType = 'ip_only_smart_v3';
          console.log('✅ [CORRELAÇÃO V3] Método 5 - Match inteligente por IP:', {
            campaign_id: match.campaign_id,
            confidence: score,
            time_diff_minutes: timeDiff.toFixed(1),
            is_paid_traffic: paidSessions.includes(match)
          });
        }
      }
    }
    
    if (bestMatch && bestScore >= 60) {
      // Ajustar score final baseado em fatores adicionais
      const sessionTime = new Date(bestMatch.created_at).getTime();
      const timeDiffMinutes = Math.abs(leadTime - sessionTime) / (1000 * 60);
      
      // Bonus para campanhas com UTMs completos
      if (bestMatch.utm_source && bestMatch.utm_medium && bestMatch.utm_campaign) {
        bestScore += 2;
      }
      
      // Garantir que não ultrapasse 100
      bestScore = Math.min(bestScore, 100);
      
      console.log('🎯 [CORRELAÇÃO V3] SUCESSO - Melhor match encontrado:', {
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
    
    console.log('❌ [CORRELAÇÃO V3] Nenhum match encontrado com confiança suficiente (mín. 60%)');
    return null;
  } catch (error) {
    console.error('❌ [CORRELAÇÃO V3] Erro geral ao buscar tracking por sessão:', error);
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
