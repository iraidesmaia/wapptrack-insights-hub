
import { supabase } from "../integrations/supabase/client";

export const getDashboardStats = async () => {
  try {
    // RLS garantirá que apenas dados do usuário logado sejam retornados
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at');

    if (leadsError) throw leadsError;

    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, active');

    if (campaignsError) throw campaignsError;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('value, date');

    if (salesError) throw salesError;

    const totalLeads = leads?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.active)?.length || 0;
    const totalSales = sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const conversionRate = totalLeads > 0 ? ((sales?.length || 0) / totalLeads) * 100 : 0;

    return {
      totalLeads,
      activeCampaigns,
      totalSales,
      conversionRate: parseFloat(conversionRate.toFixed(2))
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalLeads: 0,
      activeCampaigns: 0,
      totalSales: 0,
      conversionRate: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (days: number = 30) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    // RLS garantirá que apenas dados do usuário logado sejam retornados
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, status, created_at')
      .gte('created_at', dateFrom.toISOString());

    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('value, date')
      .gte('date', dateFrom.toISOString());

    if (salesError) throw salesError;

    const totalLeads = leads?.length || 0;
    const totalSales = sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const conversionRate = totalLeads > 0 ? ((sales?.length || 0) / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalSales,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      period: `${days} dias`
    };
  } catch (error) {
    console.error("Error fetching dashboard stats by period:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      conversionRate: 0,
      period: `${days} dias`
    };
  }
};

export const getCampaignPerformance = async () => {
  try {
    // RLS garantirá que apenas dados do usuário logado sejam retornados
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('campaign, status, created_at');

    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('campaign, value');

    if (salesError) throw salesError;

    const campaignStats: Record<string, any> = {};

    // Agrupar leads por campanha
    leads?.forEach(lead => {
      if (!campaignStats[lead.campaign]) {
        campaignStats[lead.campaign] = {
          name: lead.campaign,
          leads: 0,
          sales: 0,
          revenue: 0,
          conversionRate: 0
        };
      }
      campaignStats[lead.campaign].leads++;
    });

    // Agrupar vendas por campanha
    sales?.forEach(sale => {
      if (campaignStats[sale.campaign]) {
        campaignStats[sale.campaign].sales++;
        campaignStats[sale.campaign].revenue += sale.value || 0;
      }
    });

    // Calcular taxa de conversão
    Object.values(campaignStats).forEach((campaign: any) => {
      campaign.conversionRate = campaign.leads > 0 
        ? parseFloat(((campaign.sales / campaign.leads) * 100).toFixed(2))
        : 0;
    });

    return Object.values(campaignStats);
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};

export const getMonthlyStats = async () => {
  try {
    const currentDate = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      // RLS garantirá que apenas dados do usuário logado sejam retornados
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextMonth.toISOString());

      if (leadsError) throw leadsError;

      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('value')
        .gte('date', date.toISOString())
        .lt('date', nextMonth.toISOString());

      if (salesError) throw salesError;

      last6Months.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        leads: leads?.length || 0,
        sales: sales?.length || 0,
        revenue: sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0
      });
    }

    return last6Months;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
};

export const getTimelineData = async () => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    // RLS garantirá que apenas dados do usuário logado sejam retornados
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', dateFrom.toISOString())
      .order('created_at');

    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('date')
      .gte('date', dateFrom.toISOString())
      .order('date');

    if (salesError) throw salesError;

    const timeline: Record<string, any> = {};

    // Processar leads
    leads?.forEach(lead => {
      const date = new Date(lead.created_at).toLocaleDateString('pt-BR');
      if (!timeline[date]) {
        timeline[date] = { date, leads: 0, sales: 0 };
      }
      timeline[date].leads++;
    });

    // Processar vendas
    sales?.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR');
      if (!timeline[date]) {
        timeline[date] = { date, leads: 0, sales: 0 };
      }
      timeline[date].sales++;
    });

    return Object.values(timeline).sort((a: any, b: any) => 
      new Date(a.date.split('/').reverse().join('-')).getTime() - 
      new Date(b.date.split('/').reverse().join('-')).getTime()
    );
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};
