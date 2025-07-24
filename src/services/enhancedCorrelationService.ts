import { supabase } from "../integrations/supabase/client";

export interface CorrelationScore {
  score: number;
  method: string;
  confidence: 'high' | 'medium' | 'low';
  factors: string[];
}

export interface CorrelationSuggestion {
  leadId: string;
  campaignId: string;
  campaignName: string;
  score: CorrelationScore;
  timeWindow: number; // hours
  deviceMatch?: boolean;
  locationMatch?: boolean;
  temporalMatch?: boolean;
}

/**
 * Serviço aprimorado de correlação com scoring de probabilidade
 * Inspirado em ferramentas como TinTim
 */
export class EnhancedCorrelationService {
  private static readonly EXTENDED_TIME_WINDOW = 48; // 48 horas
  private static readonly HIGH_CONFIDENCE_THRESHOLD = 0.8;
  private static readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.5;

  /**
   * Encontra correlações perdidas com scoring de probabilidade
   */
  static async findMissingCorrelations(leadId?: string): Promise<CorrelationSuggestion[]> {
    try {
      // Buscar leads órfãos (sem campaign_id ou com tracking_method organic)
      const leadsQuery = supabase
        .from('leads')
        .select('*')
        .or('campaign_id.is.null,tracking_method.eq.organic')
        .gte('created_at', new Date(Date.now() - this.EXTENDED_TIME_WINDOW * 60 * 60 * 1000).toISOString());

      if (leadId) {
        leadsQuery.eq('id', leadId);
      }

      const { data: orphanLeads, error: leadsError } = await leadsQuery;

      if (leadsError || !orphanLeads) {
        console.error('Erro ao buscar leads órfãos:', leadsError);
        return [];
      }

      const suggestions: CorrelationSuggestion[] = [];

      for (const lead of orphanLeads) {
        const leadSuggestions = await this.findCorrelationsForLead(lead);
        suggestions.push(...leadSuggestions);
      }

      // Ordenar por score decrescente
      return suggestions.sort((a, b) => b.score.score - a.score.score);
    } catch (error) {
      console.error('Erro ao encontrar correlações perdidas:', error);
      return [];
    }
  }

  /**
   * Encontra correlações para um lead específico
   */
  private static async findCorrelationsForLead(lead: any): Promise<CorrelationSuggestion[]> {
    const suggestions: CorrelationSuggestion[] = [];
    const leadCreatedAt = new Date(lead.created_at);

    // 1. Buscar por sessões de tracking ativas no período
    const { data: trackingSessions } = await supabase
      .from('tracking_sessions')
      .select('*')
      .gte('created_at', new Date(leadCreatedAt.getTime() - this.EXTENDED_TIME_WINDOW * 60 * 60 * 1000).toISOString())
      .lte('created_at', new Date(leadCreatedAt.getTime() + 4 * 60 * 60 * 1000).toISOString()); // 4h após o lead

    // 2. Buscar por sessões UTM pendentes
    const { data: utmSessions } = await supabase
      .from('utm_sessions')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', new Date(leadCreatedAt.getTime() - this.EXTENDED_TIME_WINDOW * 60 * 60 * 1000).toISOString())
      .lte('created_at', new Date(leadCreatedAt.getTime() + 4 * 60 * 60 * 1000).toISOString());

    // 3. Buscar dados do dispositivo
    const { data: deviceData } = await supabase
      .from('device_data')
      .select('*')
      .eq('phone', lead.phone)
      .order('created_at', { ascending: false })
      .limit(1);

    // 4. Buscar campanhas ativas
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('active', true);

    if (!campaigns) return suggestions;

    // Avaliar correlações para cada sessão de tracking
    if (trackingSessions) {
      for (const session of trackingSessions) {
        const campaign = campaigns.find(c => c.id === session.campaign_id);
        if (!campaign) continue;

        const score = this.calculateCorrelationScore(lead, session, deviceData?.[0], leadCreatedAt);
        if (score.score >= 0.3) { // Threshold mínimo
          suggestions.push({
            leadId: lead.id,
            campaignId: campaign.id,
            campaignName: campaign.name,
            score,
            timeWindow: Math.abs(leadCreatedAt.getTime() - new Date(session.created_at).getTime()) / (1000 * 60 * 60),
            deviceMatch: this.checkDeviceMatch(lead, session, deviceData?.[0]),
            locationMatch: this.checkLocationMatch(lead, session, deviceData?.[0]),
            temporalMatch: this.checkTemporalMatch(leadCreatedAt, new Date(session.created_at))
          });
        }
      }
    }

    // Avaliar correlações para sessões UTM
    if (utmSessions) {
      for (const utmSession of utmSessions) {
        // Tentar correlacionar com campanhas baseado nos UTMs
        const matchingCampaigns = campaigns.filter(c => 
          (utmSession.utm_source && c.utm_source === utmSession.utm_source) ||
          (utmSession.utm_campaign && c.utm_campaign === utmSession.utm_campaign) ||
          (utmSession.utm_medium && c.utm_medium === utmSession.utm_medium)
        );

        for (const campaign of matchingCampaigns) {
          const score = this.calculateUtmCorrelationScore(lead, utmSession, deviceData?.[0], leadCreatedAt);
          if (score.score >= 0.3) {
            suggestions.push({
              leadId: lead.id,
              campaignId: campaign.id,
              campaignName: campaign.name,
              score,
              timeWindow: Math.abs(leadCreatedAt.getTime() - new Date(utmSession.created_at).getTime()) / (1000 * 60 * 60),
              deviceMatch: this.checkDeviceMatch(lead, utmSession, deviceData?.[0]),
              locationMatch: this.checkLocationMatch(lead, utmSession, deviceData?.[0]),
              temporalMatch: this.checkTemporalMatch(leadCreatedAt, new Date(utmSession.created_at))
            });
          }
        }
      }
    }

    return suggestions;
  }

  /**
   * Calcula score de correlação baseado em múltiplos fatores
   */
  private static calculateCorrelationScore(
    lead: any, 
    session: any, 
    deviceData: any, 
    leadCreatedAt: Date
  ): CorrelationScore {
    let score = 0;
    const factors: string[] = [];
    const sessionCreatedAt = new Date(session.created_at);

    // 1. Correlação por IP (peso: 0.3)
    if (lead.ip_address && session.ip_address && lead.ip_address === session.ip_address) {
      score += 0.3;
      factors.push('IP match');
    }

    // 2. Correlação por User Agent (peso: 0.2)
    if (lead.browser && session.user_agent && session.user_agent.includes(lead.browser)) {
      score += 0.2;
      factors.push('Browser match');
    }

    // 3. Correlação temporal (peso: 0.2)
    const timeDiffHours = Math.abs(leadCreatedAt.getTime() - sessionCreatedAt.getTime()) / (1000 * 60 * 60);
    if (timeDiffHours <= 1) {
      score += 0.2;
      factors.push('Strong temporal correlation (≤1h)');
    } else if (timeDiffHours <= 4) {
      score += 0.15;
      factors.push('Good temporal correlation (≤4h)');
    } else if (timeDiffHours <= 24) {
      score += 0.1;
      factors.push('Weak temporal correlation (≤24h)');
    }

    // 4. Correlação por geolocalização (peso: 0.15)
    if (this.checkLocationMatch(lead, session, deviceData)) {
      score += 0.15;
      factors.push('Location match');
    }

    // 5. Correlação por fingerprint do browser (peso: 0.15)
    if (session.browser_fingerprint && deviceData?.browser === lead.browser) {
      score += 0.15;
      factors.push('Browser fingerprint');
    }

    const confidence = score >= this.HIGH_CONFIDENCE_THRESHOLD ? 'high' : 
                      score >= this.MEDIUM_CONFIDENCE_THRESHOLD ? 'medium' : 'low';

    return {
      score: Math.min(score, 1), // Cap em 1.0
      method: 'tracking_session',
      confidence,
      factors
    };
  }

  /**
   * Calcula score para correlação via UTM
   */
  private static calculateUtmCorrelationScore(
    lead: any, 
    utmSession: any, 
    deviceData: any, 
    leadCreatedAt: Date
  ): CorrelationScore {
    let score = 0;
    const factors: string[] = [];
    const sessionCreatedAt = new Date(utmSession.created_at);

    // 1. Correlação por telefone (peso: 0.4)
    if (utmSession.phone && utmSession.phone === lead.phone) {
      score += 0.4;
      factors.push('Phone match');
    }

    // 2. Correlação por IP (peso: 0.2)
    if (lead.ip_address && utmSession.ip_address && lead.ip_address === utmSession.ip_address) {
      score += 0.2;
      factors.push('IP match');
    }

    // 3. Correlação temporal (peso: 0.25)
    const timeDiffHours = Math.abs(leadCreatedAt.getTime() - sessionCreatedAt.getTime()) / (1000 * 60 * 60);
    if (timeDiffHours <= 1) {
      score += 0.25;
      factors.push('Strong temporal correlation (≤1h)');
    } else if (timeDiffHours <= 4) {
      score += 0.2;
      factors.push('Good temporal correlation (≤4h)');
    } else if (timeDiffHours <= 24) {
      score += 0.15;
      factors.push('Weak temporal correlation (≤24h)');
    }

    // 4. Correlação por User Agent (peso: 0.15)
    if (lead.browser && utmSession.user_agent && utmSession.user_agent.includes(lead.browser)) {
      score += 0.15;
      factors.push('User Agent match');
    }

    const confidence = score >= this.HIGH_CONFIDENCE_THRESHOLD ? 'high' : 
                      score >= this.MEDIUM_CONFIDENCE_THRESHOLD ? 'medium' : 'low';

    return {
      score: Math.min(score, 1),
      method: 'utm_session',
      confidence,
      factors
    };
  }

  /**
   * Verifica match de dispositivo
   */
  private static checkDeviceMatch(lead: any, session: any, deviceData: any): boolean {
    return (lead.browser && session.user_agent?.includes(lead.browser)) ||
           (lead.os && session.user_agent?.includes(lead.os)) ||
           (deviceData?.device_type && lead.device_type === deviceData.device_type);
  }

  /**
   * Verifica match de localização
   */
  private static checkLocationMatch(lead: any, session: any, deviceData: any): boolean {
    return (lead.ip_address && session.ip_address === lead.ip_address) ||
           (lead.city && (session.city === lead.city || deviceData?.city === lead.city)) ||
           (lead.country && (session.country === lead.country || deviceData?.country === lead.country));
  }

  /**
   * Verifica correlação temporal
   */
  private static checkTemporalMatch(leadTime: Date, sessionTime: Date): boolean {
    const diffHours = Math.abs(leadTime.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
    return diffHours <= 4; // Consideramos boa correlação até 4h
  }

  /**
   * Aplica uma correlação sugerida
   */
  static async applyCorrelation(leadId: string, campaignId: string, reason: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          campaign_id: campaignId,
          tracking_method: 'correlation_applied',
          notes: `Correlação aplicada: ${reason}`
        })
        .eq('id', leadId);

      if (error) {
        console.error('Erro ao aplicar correlação:', error);
        return false;
      }

      // Log da correlação aplicada
      console.log(`✅ Correlação aplicada: Lead ${leadId} → Campanha ${campaignId}. Motivo: ${reason}`);
      
      return true;
    } catch (error) {
      console.error('Erro ao aplicar correlação:', error);
      return false;
    }
  }

  /**
   * Registra histórico de correlações aplicadas nas notas do lead
   */
  private static async recordCorrelationHistory(leadId: string, campaignId: string, reason: string) {
    try {
      // Buscar campanha para obter o nome
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('name')
        .eq('id', campaignId)
        .single();

      // Atualizar notas do lead com histórico
      const historyNote = `[${new Date().toLocaleString()}] Correlação aplicada: ${campaign?.name || campaignId}. Motivo: ${reason}`;
      
      const { data: lead } = await supabase
        .from('leads')
        .select('notes')
        .eq('id', leadId)
        .single();

      const updatedNotes = lead?.notes ? `${lead.notes}\n${historyNote}` : historyNote;

      await supabase
        .from('leads')
        .update({ notes: updatedNotes })
        .eq('id', leadId);
    } catch (error) {
      console.error('Erro ao registrar histórico de correlação:', error);
    }
  }

  /**
   * Obtém estatísticas de correlação
   */
  static async getCorrelationStats(): Promise<{
    totalLeads: number;
    orphanLeads: number;
    correlatedLeads: number;
    correlationRate: number;
    highConfidenceSuggestions: number;
  }> {
    try {
      const [
        { data: totalLeads },
        { data: orphanLeads },
        { data: correlatedLeads }
      ] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact' }),
        supabase.from('leads').select('id', { count: 'exact' }).or('campaign_id.is.null,tracking_method.eq.organic'),
        supabase.from('leads').select('id', { count: 'exact' }).not('campaign_id', 'is', null)
      ]);

      const suggestions = await this.findMissingCorrelations();
      const highConfidenceSuggestions = suggestions.filter(s => s.score.confidence === 'high').length;

      return {
        totalLeads: totalLeads?.length || 0,
        orphanLeads: orphanLeads?.length || 0,
        correlatedLeads: correlatedLeads?.length || 0,
        correlationRate: totalLeads?.length ? (correlatedLeads?.length || 0) / totalLeads.length : 0,
        highConfidenceSuggestions
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de correlação:', error);
      return {
        totalLeads: 0,
        orphanLeads: 0,
        correlatedLeads: 0,
        correlationRate: 0,
        highConfidenceSuggestions: 0
      };
    }
  }
}