
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
    console.log('🔄 Iniciando recorrelação manual para lead:', leadId, phone);
    
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

    // Buscar correlações nas últimas 24 horas
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    let bestMatch: CorrelationResult | null = null;
    let bestScore = 0;

    // Método 1: IP + User Agent
    if (deviceData.ip_address && deviceData.user_agent) {
      const userAgentParts = deviceData.user_agent.split(' ').slice(0, 3).join(' ');
      
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .ilike('user_agent', `%${userAgentParts}%`)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const score = 90;
        
        if (score > bestScore) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_user_agent',
            confidence_score: score
          };
        }
      }
    }

    // Método 2: IP + Timezone
    if (deviceData.ip_address && deviceData.timezone) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .eq('timezone', deviceData.timezone)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const score = 80;
        
        if (score > bestScore || !bestMatch) {
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

    // Método 3: Apenas IP
    if (deviceData.ip_address && (!bestMatch || bestScore < 70)) {
      const { data: matches, error } = await supabase
        .from('tracking_sessions')
        .select('*')
        .eq('ip_address', deviceData.ip_address)
        .gte('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && matches && matches.length > 0) {
        const match = matches[0];
        const score = 60;
        
        if (score > bestScore || !bestMatch) {
          bestScore = score;
          bestMatch = {
            campaign_id: match.campaign_id,
            utm_source: match.utm_source,
            utm_medium: match.utm_medium,
            utm_campaign: match.utm_campaign,
            utm_content: match.utm_content,
            utm_term: match.utm_term,
            match_type: 'ip_only',
            confidence_score: score
          };
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

      console.log('✅ Melhor correlação encontrada:', bestMatch);
      return bestMatch;
    }

    console.log('❌ Nenhuma correlação encontrada');
    return null;
  } catch (error) {
    console.error('❌ Erro na recorrelação:', error);
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
      
      if (correlation && correlation.confidence_score >= 70) {
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
