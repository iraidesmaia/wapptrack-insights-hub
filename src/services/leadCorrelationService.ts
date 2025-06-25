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
}

export const recorrelateLead = async (leadId: string, phone: string): Promise<CorrelationResult | null> => {
  try {
    console.log('🔄 Iniciando recorrelação manual melhorada para lead:', leadId, phone);
    
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
      toast.error('Nenhum dado do dispositivo encontrado para este telefone');
      return null;
    }

    // ALGORITMO MELHORADO: Buscar correlações nas últimas 48 horas (expandido)
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    
    let bestMatch: CorrelationResult | null = null;
    let bestScore = 0;

    // MÉTODO 1: IP + User Agent Exato (95%)
    if (deviceData.ip_address && deviceData.user_agent) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('user_agent', deviceData.user_agent)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        let score = 95;
        
        // Bonus por tempo recente
        if (timeDiff < 15) score += 5;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_user_agent_exact',
            confidence_score: score
          };
        }
      }
    }

    // MÉTODO 2: IP + User Agent Parcial (85%)
    if ((!bestMatch || bestScore < 90) && deviceData.ip_address && deviceData.user_agent) {
      const userAgentCore = deviceData.user_agent.split(' ').slice(0, 4).join(' ');
      
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .ilike('user_agent', `%${userAgentCore}%`)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        let score = 85;
        
        // Bonus por tempo recente
        if (timeDiff < 20) score += 5;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_user_agent_partial',
            confidence_score: score
          };
        }
      }
    }

    // MÉTODO 3: IP + Timezone + Screen Resolution (80%)
    if ((!bestMatch || bestScore < 80) && deviceData.ip_address && deviceData.timezone && deviceData.screen_resolution) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .eq('screen_resolution', deviceData.screen_resolution)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        let score = 80;
        
        // Bonus por tempo recente
        if (timeDiff < 30) score += 5;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_timezone_screen',
            confidence_score: score
          };
        }
      }
    }

    // MÉTODO 4: IP + Timezone (75%)
    if ((!bestMatch || bestScore < 75) && deviceData.ip_address && deviceData.timezone) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(7);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        let score = 75;
        
        // Bonus por tempo recente
        if (timeDiff < 45) score += 5;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_timezone',
            confidence_score: score
          };
        }
      }
    }

    // MÉTODO 5: IP + Language + Browser Context (70%)
    if ((!bestMatch || bestScore < 70) && deviceData.ip_address && deviceData.language && deviceData.browser) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('language', deviceData.language)
        .ilike('user_agent', `%${deviceData.browser}%`)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(7);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const timeDiff = (Date.now() - new Date(match.created_at).getTime()) / (1000 * 60);
        let score = 70;
        
        // Bonus por tempo recente
        if (timeDiff < 60) score += 5;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_language_browser',
            confidence_score: score
          };
        }
      }
    }

    // MÉTODO 6: Apenas IP com scoring inteligente (60-65%)
    if ((!bestMatch || bestScore < 65) && deviceData.ip_address) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(15);

      if (!error && matches && matches.length > 0) {
        // Priorizar sessões com UTMs de tráfego pago
        for (const session of matches) {
          const timeDiff = (Date.now() - new Date(session.created_at).getTime()) / (1000 * 60);
          
          const isPaidTraffic = session.utm_medium && 
            (session.utm_medium.includes('cpc') || 
             session.utm_medium.includes('paid') || 
             session.utm_source.includes('facebook') || 
             session.utm_source.includes('google'));
          
          let score = 60;
          if (isPaidTraffic) score += 5;
          if (timeDiff < 90) score += 3;
          if (timeDiff < 60) score += 2;
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = {
              campaign_id: session.campaign_id,
              utm_source: session.utm_source,
              utm_medium: session.utm_medium,
              utm_campaign: session.utm_campaign,
              utm_content: session.utm_content,
              utm_term: session.utm_term,
              match_type: 'ip_only_smart',
              confidence_score: score
            };
            break;
          }
        }
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

      // Ajuste final do score baseado em qualidade dos UTMs
      if (bestMatch.utm_source && bestMatch.utm_medium && bestMatch.utm_campaign) {
        bestMatch.confidence_score = Math.min((bestMatch.confidence_score || 0) + 2, 100);
      }

      console.log('✅ Melhor correlação encontrada com algoritmo melhorado:', bestMatch);
      return bestMatch;
    }

    console.log('❌ Nenhuma correlação encontrada com confiança suficiente (>= 60%)');
    return null;
  } catch (error) {
    console.error('❌ Erro na recorrelação melhorada:', error);
    return null;
  }
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
        .select('phone')
        .eq('id', leadId)
        .single();

      if (error || !lead) continue;

      // Tentar recorrelacionar
      const correlation = await recorrelateLead(leadId, lead.phone);
      
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
