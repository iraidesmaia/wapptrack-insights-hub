
import { supabase } from "../integrations/supabase/client";

export interface AttributionData {
  source: string;
  medium: string;
  campaign: string;
  leads_count: number;
  conversion_rate: number;
  avg_lead_score: number;
  total_value: number;
  cost_per_lead: number;
  roi: number;
}

export interface LeadSourceReport {
  date: string;
  instagram_leads: number;
  facebook_leads: number;
  other_leads: number;
  instagram_conversions: number;
  facebook_conversions: number;
  other_conversions: number;
}

export interface CampaignPerformanceDetail {
  campaign_id: string;
  campaign_name: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  total_leads: number;
  qualified_leads: number;
  converted_leads: number;
  lost_leads: number;
  avg_lead_score: number;
  conversion_rate: number;
  qualification_rate: number;
  total_investment?: number;
  cost_per_lead?: number;
  roi?: number;
}

export const getAttributionReport = async (
  startDate?: string,
  endDate?: string
): Promise<AttributionData[]> => {
  try {
    let query = supabase
      .from('leads')
      .select(`
        *,
        campaigns!leads_campaign_id_fkey(
          utm_source,
          utm_medium,
          utm_campaign,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    // Group by attribution data
    const attributionMap = new Map<string, {
      source: string;
      medium: string;
      campaign: string;
      leads: any[];
      conversions: number;
      total_score: number;
    }>();

    leads?.forEach(lead => {
      const campaign = lead.campaigns;
      const source = campaign?.utm_source || 'direct';
      const medium = campaign?.utm_medium || 'organic';
      const campaignName = campaign?.utm_campaign || campaign?.name || 'unknown';
      
      const key = `${source}-${medium}-${campaignName}`;
      
      if (!attributionMap.has(key)) {
        attributionMap.set(key, {
          source,
          medium,
          campaign: campaignName,
          leads: [],
          conversions: 0,
          total_score: 0
        });
      }
      
      const attribution = attributionMap.get(key)!;
      attribution.leads.push(lead);
      
      if (lead.status === 'converted') {
        attribution.conversions++;
      }
      
      // Use a default score if not available - safely access lead_score
      const leadScore = (lead as any).lead_score || 50;
      attribution.total_score += leadScore;
    });

    // Convert to array and calculate metrics
    const attributionData: AttributionData[] = Array.from(attributionMap.values()).map(attr => {
      const leadsCount = attr.leads.length;
      const conversionRate = leadsCount > 0 ? (attr.conversions / leadsCount) * 100 : 0;
      const avgLeadScore = leadsCount > 0 ? attr.total_score / leadsCount : 0;
      
      return {
        source: attr.source,
        medium: attr.medium,
        campaign: attr.campaign,
        leads_count: leadsCount,
        conversion_rate: conversionRate,
        avg_lead_score: avgLeadScore,
        total_value: attr.conversions * 100, // Assuming R$100 per conversion
        cost_per_lead: 0, // Would need ad spend data
        roi: 0 // Would need cost data
      };
    });

    return attributionData.sort((a, b) => b.leads_count - a.leads_count);
  } catch (error) {
    console.error("Error getting attribution report:", error);
    return [];
  }
};

export const getLeadSourceReport = async (
  startDate?: string,
  endDate?: string
): Promise<LeadSourceReport[]> => {
  try {
    let query = supabase
      .from('leads')
      .select(`
        created_at,
        status,
        campaigns!leads_campaign_id_fkey(utm_source)
      `)
      .order('created_at', { ascending: true });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    // Group by date
    const dateMap = new Map<string, {
      instagram_leads: number;
      facebook_leads: number;
      other_leads: number;
      instagram_conversions: number;
      facebook_conversions: number;
      other_conversions: number;
    }>();

    leads?.forEach(lead => {
      const date = lead.created_at.split('T')[0]; // Get date part only
      const source = lead.campaigns?.utm_source || 'other';
      const isConversion = lead.status === 'converted';
      
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          instagram_leads: 0,
          facebook_leads: 0,
          other_leads: 0,
          instagram_conversions: 0,
          facebook_conversions: 0,
          other_conversions: 0
        });
      }
      
      const dayData = dateMap.get(date)!;
      
      if (source === 'instagram') {
        dayData.instagram_leads++;
        if (isConversion) dayData.instagram_conversions++;
      } else if (source === 'facebook') {
        dayData.facebook_leads++;
        if (isConversion) dayData.facebook_conversions++;
      } else {
        dayData.other_leads++;
        if (isConversion) dayData.other_conversions++;
      }
    });

    // Convert to array
    return Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
  } catch (error) {
    console.error("Error getting lead source report:", error);
    return [];
  }
};

export const getCampaignPerformanceDetails = async (
  startDate?: string,
  endDate?: string
): Promise<CampaignPerformanceDetail[]> => {
  try {
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        leads!leads_campaign_id_fkey(*)
      `)
      .order('created_at', { ascending: false });

    const { data: campaigns, error } = await query;

    if (error) throw error;

    return campaigns?.map(campaign => {
      const leads = campaign.leads || [];
      
      // Filter by date if provided
      const filteredLeads = leads.filter(lead => {
        if (startDate && lead.created_at < startDate) return false;
        if (endDate && lead.created_at > endDate) return false;
        return true;
      });
      
      const totalLeads = filteredLeads.length;
      const qualifiedLeads = filteredLeads.filter(l => 
        ['contacted', 'qualified', 'converted'].includes(l.status)
      ).length;
      const convertedLeads = filteredLeads.filter(l => l.status === 'converted').length;
      const lostLeads = filteredLeads.filter(l => l.status === 'lost').length;
      
      const avgLeadScore = totalLeads > 0 
        ? filteredLeads.reduce((sum, lead) => sum + ((lead as any).lead_score || 50), 0) / totalLeads 
        : 0;
      
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      const qualificationRate = totalLeads > 0 ? (qualifiedLeads / totalLeads) * 100 : 0;
      
      return {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        utm_source: campaign.utm_source || 'direct',
        utm_medium: campaign.utm_medium || 'organic',
        utm_campaign: campaign.utm_campaign || campaign.name,
        total_leads: totalLeads,
        qualified_leads: qualifiedLeads,
        converted_leads: convertedLeads,
        lost_leads: lostLeads,
        avg_lead_score: avgLeadScore,
        conversion_rate: conversionRate,
        qualification_rate: qualificationRate
      };
    }) || [];
  } catch (error) {
    console.error("Error getting campaign performance details:", error);
    return [];
  }
};
