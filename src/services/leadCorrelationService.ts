import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CorrelationResult {
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  match_type?: string;
  confidence_score?: number;
  campaign_name?: string;
  session_created_at?: string;
  time_diff_minutes?: number;
}

export const recorrelateLead = async (leadId: string, phone: string, leadCreatedAt?: string): Promise<CorrelationResult | null> => {
  try {
    console.log('🔄 Iniciando correlação melhorada V3 para lead:', leadId, phone);
    
    // Buscar dados do dispositivo para este telefone
    const { data: deviceData, error: deviceError } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', phone)
      .single();

    if (deviceError && deviceError.code !== 'PGRST116') {
      console.error('Erro ao buscar dados do dispositivo:', deviceError);
      return null;
    }

    if (!deviceData) {
      console.log('❌ Nenhum dado do dispositivo encontrado para:', phone);
      // Tentar correlação apenas por IP das sessões existentes
      return await tryCorrelationBySessionsOnly(phone, leadCreatedAt);
    }

    // ALGORITMO MELHORADO V3: Janela temporal inteligente
    const leadTime = leadCreatedAt ? new Date(leadCreatedAt).getTime() : Date.now();
    
    // Janela primária: ±30 minutos do horário do lead
    const thirtyMinutesAgo = new Date(leadTime - 30 * 60 * 1000).toISOString();
    const thirtyMinutesAfter = new Date(leadTime + 30 * 60 * 1000).toISOString();
    
    // Janela secundária: ±2 horas (para casos de delay)
    const twoHoursAgo = new Date(leadTime - 2 * 60 * 60 * 1000).toISOString();
    const twoHoursAfter = new Date(leadTime + 2 * 60 * 60 * 1000).toISOString();
    
    let bestMatch: CorrelationResult | null = null;
    let bestScore = 0;

    console.log('🕐 Janelas temporais:', {
      leadTime: new Date(leadTime).toISOString(),
      primaryWindow: `${thirtyMinutesAgo} - ${thirtyMinutesAfter}`,
      secondaryWindow: `${twoHoursAgo} - ${twoHoursAfter}`
    });

    // MÉTODO 1: Correlação por IP + User Agent na janela primária (95-100%)
    if (deviceData.ip_address && deviceData.user_agent) {
      const result = await tryCorrelationMethod({
        ip_address: deviceData.ip_address,
        user_agent: deviceData.user_agent,
        timeFrom: thirtyMinutesAgo,
        timeTo: thirtyMinutesAfter,
        baseScore: 95,
        matchType: 'ip_user_agent_primary',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    // MÉTODO 2: Correlação por IP + Partial User Agent na janela primária (90-95%)
    if ((!bestMatch || bestScore < 90) && deviceData.ip_address && deviceData.user_agent) {
      const userAgentCore = deviceData.user_agent.split(' ').slice(0, 4).join(' ');
      
      const result = await tryCorrelationMethodPartial({
        ip_address: deviceData.ip_address,
        user_agent_partial: userAgentCore,
        timeFrom: thirtyMinutesAgo,
        timeTo: thirtyMinutesAfter,
        baseScore: 90,
        matchType: 'ip_user_agent_partial_primary',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    // MÉTODO 3: Facebook/Instagram prioritário - buscar por fbclid ou fonte social (85-90%)
    if ((!bestMatch || bestScore < 85)) {
      const result = await tryCorrelationBySocialMedia({
        ip_address: deviceData.ip_address,
        timeFrom: twoHoursAgo,
        timeTo: twoHoursAfter,
        baseScore: 85,
        matchType: 'social_media_priority',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    // MÉTODO 4: Correlação por IP + Timezone + Screen na janela secundária (80-85%)
    if ((!bestMatch || bestScore < 80) && deviceData.ip_address && deviceData.timezone && deviceData.screen_resolution) {
      const result = await tryCorrelationMethod({
        ip_address: deviceData.ip_address,
        timezone: deviceData.timezone,
        screen_resolution: deviceData.screen_resolution,
        timeFrom: twoHoursAgo,
        timeTo: twoHoursAfter,
        baseScore: 80,
        matchType: 'ip_timezone_screen_secondary',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    // MÉTODO 5: Correlação por IP apenas na janela primária com scoring inteligente (75-80%)
    if ((!bestMatch || bestScore < 75) && deviceData.ip_address) {
      const result = await tryCorrelationByIpOnly({
        ip_address: deviceData.ip_address,
        timeFrom: thirtyMinutesAgo,
        timeTo: thirtyMinutesAfter,
        baseScore: 75,
        matchType: 'ip_only_primary',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    // MÉTODO 6: Correlação por IP na janela secundária (70-75%)
    if ((!bestMatch || bestScore < 70) && deviceData.ip_address) {
      const result = await tryCorrelationByIpOnly({
        ip_address: deviceData.ip_address,
        timeFrom: twoHoursAgo,
        timeTo: twoHoursAfter,
        baseScore: 70,
        matchType: 'ip_only_secondary',
        leadTime
      });
      
      if (result && result.confidence_score > bestScore) {
        bestScore = result.confidence_score;
        bestMatch = result;
      }
    }

    if (bestMatch && bestMatch.campaign_id) {
      // Buscar nome da campanha
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', bestMatch.campaign_id)
        .single();

      if (campaignData) {
        bestMatch.campaign_name = campaignData.name;
      }

      console.log('✅ Correlação V3 encontrada:', {
        ...bestMatch,
        time_diff_minutes: bestMatch.time_diff_minutes
      });
      
      return bestMatch;
    }

    console.log('❌ Nenhuma correlação V3 encontrada com confiança suficiente');
    return null;
  } catch (error) {
    console.error('❌ Erro na correlação V3:', error);
    return null;
  }
};

// Função auxiliar para tentar correlação apenas por sessões existentes
const tryCorrelationBySessionsOnly = async (phone: string, leadCreatedAt?: string): Promise<CorrelationResult | null> => {
  try {
    console.log('🔍 Tentando correlação apenas por sessões de tracking para:', phone);
    
    const leadTime = leadCreatedAt ? new Date(leadCreatedAt).getTime() : Date.now();
    const twoHoursAgo = new Date(leadTime - 2 * 60 * 60 * 1000).toISOString();
    const twoHoursAfter = new Date(leadTime + 2 * 60 * 60 * 1000).toISOString();
    
    // Buscar sessões no período próximo ao lead
    const { data: sessions, error } = await supabase
      .from('tracking_sessions')
      .select('*')
      .gte('created_at', twoHoursAgo)
      .lte('created_at', twoHoursAfter)
      .not('utm_source', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error || !sessions || sessions.length === 0) {
      console.log('❌ Nenhuma sessão encontrada no período');
      return null;
    }
    
    // Priorizar sessões de redes sociais
    const socialSessions = sessions.filter(s => 
      s.utm_source?.includes('facebook') || 
      s.utm_source?.includes('instagram') ||
      s.utm_content?.includes('fbclid')
    );
    
    const targetSessions = socialSessions.length > 0 ? socialSessions : sessions;
    const bestSession = targetSessions[0];
    
    if (bestSession) {
      const timeDiff = Math.abs(leadTime - new Date(bestSession.created_at).getTime()) / (1000 * 60);
      let score = 65;
      
      // Bonus por proximidade temporal
      if (timeDiff < 30) score += 10;
      else if (timeDiff < 60) score += 5;
      
      // Bonus por redes sociais
      if (socialSessions.includes(bestSession)) score += 5;
      
      console.log('✅ Correlação por sessão encontrada:', {
        session_id: bestSession.id,
        utm_source: bestSession.utm_source,
        time_diff: timeDiff.toFixed(1),
        score
      });
      
      return {
        campaign_id: bestSession.campaign_id,
        utm_source: bestSession.utm_source,
        utm_medium: bestSession.utm_medium,
        utm_campaign: bestSession.utm_campaign,
        utm_content: bestSession.utm_content,
        utm_term: bestSession.utm_term,
        match_type: 'session_temporal_proximity',
        confidence_score: score,
        session_created_at: bestSession.created_at,
        time_diff_minutes: timeDiff
      };
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro na correlação por sessões:', error);
    return null;
  }
};

// Função auxiliar para métodos de correlação exatos
const tryCorrelationMethod = async (params: {
  ip_address?: string;
  user_agent?: string;
  timezone?: string;
  screen_resolution?: string;
  timeFrom: string;
  timeTo: string;
  baseScore: number;
  matchType: string;
  leadTime: number;
}): Promise<CorrelationResult | null> => {
  let query = supabase.from('tracking_sessions').select('*');
  
  if (params.ip_address) query = query.eq('ip_address', params.ip_address);
  if (params.user_agent) query = query.eq('user_agent', params.user_agent);
  if (params.timezone) query = query.eq('timezone', params.timezone);
  if (params.screen_resolution) query = query.eq('screen_resolution', params.screen_resolution);
  
  const { data: matches, error } = await query
    .gte('created_at', params.timeFrom)
    .lte('created_at', params.timeTo)
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (error || !matches || matches.length === 0) return null;
  
  const match = matches[0];
  const timeDiff = Math.abs(params.leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
  
  let score = params.baseScore;
  
  // Bonus por proximidade temporal
  if (timeDiff < 5) score += 5;
  else if (timeDiff < 15) score += 3;
  else if (timeDiff < 30) score += 1;
  
  // Bonus por tráfego pago
  const isPaidTraffic = match.utm_medium && 
    (match.utm_medium.includes('cpc') || 
     match.utm_medium.includes('paid') || 
     match.utm_source?.includes('facebook') || 
     match.utm_source?.includes('instagram'));
  
  if (isPaidTraffic) score += 3;
  
  // Bonus por UTMs completos
  if (match.utm_source && match.utm_medium && match.utm_campaign) score += 2;
  
  console.log(`✅ Correlação ${params.matchType}:`, {
    score,
    timeDiff: timeDiff.toFixed(1),
    isPaid: isPaidTraffic,
    utm_source: match.utm_source
  });
  
  return {
    campaign_id: match.campaign_id,
    utm_source: match.utm_source,
    utm_medium: match.utm_medium,
    utm_campaign: match.utm_campaign,
    utm_content: match.utm_content,
    utm_term: match.utm_term,
    match_type: params.matchType,
    confidence_score: Math.min(score, 100),
    session_created_at: match.created_at,
    time_diff_minutes: timeDiff
  };
};

// Função auxiliar para correlação parcial de User Agent
const tryCorrelationMethodPartial = async (params: {
  ip_address: string;
  user_agent_partial: string;
  timeFrom: string;
  timeTo: string;
  baseScore: number;
  matchType: string;
  leadTime: number;
}): Promise<CorrelationResult | null> => {
  const { data: matches, error } = await supabase
    .from('tracking_sessions')
    .select('*')
    .eq('ip_address', params.ip_address)
    .ilike('user_agent', `%${params.user_agent_partial}%`)
    .gte('created_at', params.timeFrom)
    .lte('created_at', params.timeTo)
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error || !matches || matches.length === 0) return null;
  
  const match = matches[0];
  const timeDiff = Math.abs(params.leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
  
  let score = params.baseScore;
  if (timeDiff < 10) score += 5;
  else if (timeDiff < 20) score += 3;
  
  const isPaidTraffic = match.utm_medium && 
    (match.utm_medium.includes('cpc') || 
     match.utm_source?.includes('facebook') || 
     match.utm_source?.includes('instagram'));
  
  if (isPaidTraffic) score += 3;
  
  return {
    campaign_id: match.campaign_id,
    utm_source: match.utm_source,
    utm_medium: match.utm_medium,
    utm_campaign: match.utm_campaign,
    utm_content: match.utm_content,
    utm_term: match.utm_term,
    match_type: params.matchType,
    confidence_score: Math.min(score, 100),
    session_created_at: match.created_at,
    time_diff_minutes: timeDiff
  };
};

// Função auxiliar para correlação prioritária de redes sociais
const tryCorrelationBySocialMedia = async (params: {
  ip_address?: string;
  timeFrom: string;
  timeTo: string;
  baseScore: number;
  matchType: string;
  leadTime: number;
}): Promise<CorrelationResult | null> => {
  let query = supabase.from('tracking_sessions').select('*');
  
  if (params.ip_address) {
    query = query.eq('ip_address', params.ip_address);
  }
  
  const { data: matches, error } = await query
    .gte('created_at', params.timeFrom)
    .lte('created_at', params.timeTo)
    .or('utm_source.ilike.%facebook%,utm_source.ilike.%instagram%,utm_content.ilike.%fbclid%')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (error || !matches || matches.length === 0) return null;
  
  const match = matches[0];
  const timeDiff = Math.abs(params.leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
  
  let score = params.baseScore;
  
  // Bonus alto para redes sociais
  if (match.utm_source?.includes('facebook') || match.utm_source?.includes('instagram')) {
    score += 5;
  }
  
  // Bonus por fbclid
  if (match.utm_content?.includes('fbclid')) {
    score += 3;
  }
  
  // Bonus por proximidade temporal
  if (timeDiff < 30) score += 5;
  else if (timeDiff < 60) score += 3;
  
  console.log('✅ Correlação social media:', {
    score,
    timeDiff: timeDiff.toFixed(1),
    utm_source: match.utm_source,
    has_fbclid: match.utm_content?.includes('fbclid')
  });
  
  return {
    campaign_id: match.campaign_id,
    utm_source: match.utm_source,
    utm_medium: match.utm_medium,
    utm_campaign: match.utm_campaign,
    utm_content: match.utm_content,
    utm_term: match.utm_term,
    match_type: params.matchType,
    confidence_score: Math.min(score, 100),
    session_created_at: match.created_at,
    time_diff_minutes: timeDiff
  };
};

// Função auxiliar para correlação apenas por IP
const tryCorrelationByIpOnly = async (params: {
  ip_address: string;
  timeFrom: string;
  timeTo: string;
  baseScore: number;
  matchType: string;
  leadTime: number;
}): Promise<CorrelationResult | null> => {
  const { data: matches, error } = await supabase
    .from('tracking_sessions')
    .select('*')
    .eq('ip_address', params.ip_address)
    .gte('created_at', params.timeFrom)
    .lte('created_at', params.timeTo)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (error || !matches || matches.length === 0) return null;
  
  // Priorizar sessões de tráfego pago
  const paidSessions = matches.filter(s => 
    s.utm_medium && 
    (s.utm_medium.includes('cpc') || 
     s.utm_medium.includes('paid') || 
     s.utm_source?.includes('facebook') || 
     s.utm_source?.includes('instagram'))
  );
  
  const targetSessions = paidSessions.length > 0 ? paidSessions : matches;
  const match = targetSessions[0];
  
  const timeDiff = Math.abs(params.leadTime - new Date(match.created_at).getTime()) / (1000 * 60);
  
  let score = params.baseScore;
  
  // Bonus por tráfego pago
  if (paidSessions.includes(match)) score += 5;
  
  // Bonus por proximidade temporal
  if (timeDiff < 15) score += 5;
  else if (timeDiff < 30) score += 3;
  else if (timeDiff < 60) score += 1;
  
  return {
    campaign_id: match.campaign_id,
    utm_source: match.utm_source,
    utm_medium: match.utm_medium,
    utm_campaign: match.utm_campaign,
    utm_content: match.utm_content,
    utm_term: match.utm_term,
    match_type: params.matchType,
    confidence_score: Math.min(score, 100),
    session_created_at: match.created_at,
    time_diff_minutes: timeDiff
  };
};

export const applyCorrelationToLead = async (leadId: string, correlation: CorrelationResult): Promise<boolean> => {
  try {
    console.log('🔄 Aplicando correlação ao lead:', leadId, correlation);
    
    const updateData = {
      campaign_id: correlation.campaign_id,
      campaign: correlation.campaign_name || 'Campanha Correlacionada',
      utm_source: correlation.utm_source,
      utm_medium: correlation.utm_medium,
      utm_campaign: correlation.utm_campaign,
      utm_content: correlation.utm_content,
      utm_term: correlation.utm_term,
      tracking_method: `manual_${correlation.match_type}_${correlation.confidence_score}`
    };

    const { error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId);

    if (error) {
      console.error('❌ Erro ao atualizar lead:', error);
      toast.error('Erro ao aplicar correlação ao lead');
      return false;
    }

    console.log('✅ Correlação aplicada com sucesso ao lead');
    toast.success(`Correlação aplicada com ${correlation.confidence_score}% de confiança`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao aplicar correlação:', error);
    toast.error('Erro ao aplicar correlação');
    return false;
  }
};

export const batchRecorrelateLead = async (leadIds: string[]): Promise<number> => {
  let successCount = 0;
  
  for (const leadId of leadIds) {
    try {
      // Buscar dados do lead
      const { data: lead, error } = await supabase
        .from('leads')
        .select('phone, created_at')
        .eq('id', leadId)
        .single();

      if (error || !lead) continue;

      // Tentar recorrelacionar
      const correlation = await recorrelateLead(leadId, lead.phone, lead.created_at);
      
      if (correlation && correlation.confidence_score >= 60) {
        const success = await applyCorrelationToLead(leadId, correlation);
        if (success) {
          successCount++;
        }
      }
      
      // Pequeno delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('❌ Erro na recorrelação em lote:', error);
    }
  }
  
  return successCount;
};

// Nova função para correlação retroativa automática
export const retroactiveCorrelation = async (): Promise<number> => {
  try {
    console.log('🔄 Iniciando correlação retroativa automática...');
    
    // Buscar leads dos últimos 7 dias sem UTMs ou com tracking_method 'direct'
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: leads, error } = await supabase
      .from('leads')
      .select('id, phone, created_at, utm_source, tracking_method')
      .gte('created_at', sevenDaysAgo)
      .or('utm_source.is.null,tracking_method.eq.direct')
      .limit(50);
    
    if (error || !leads) {
      console.error('❌ Erro ao buscar leads para correlação retroativa:', error);
      return 0;
    }
    
    console.log(`📋 ${leads.length} leads encontrados para correlação retroativa`);
    
    let successCount = 0;
    
    for (const lead of leads) {
      try {
        const correlation = await recorrelateLead(lead.id, lead.phone, lead.created_at);
        
        if (correlation && correlation.confidence_score >= 70) {
          const success = await applyCorrelationToLead(lead.id, correlation);
          if (success) {
            successCount++;
            console.log(`✅ Lead ${lead.id} recorrelacionado com sucesso`);
          }
        }
        
        // Delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Erro ao recorrelacionar lead ${lead.id}:`, error);
      }
    }
    
    console.log(`✅ Correlação retroativa concluída: ${successCount}/${leads.length} leads recorrelacionados`);
    return successCount;
  } catch (error) {
    console.error('❌ Erro na correlação retroativa:', error);
    return 0;
  }
};
