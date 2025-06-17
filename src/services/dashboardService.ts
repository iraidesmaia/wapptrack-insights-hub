
import { supabase } from "../integrations/supabase/client";

export const getDashboardStats = async (clientId?: string) => {
  try {
    // RLS garantirá que apenas dados do usuário logado sejam retornados
    let leadsQuery = supabase
      .from('leads')
      .select('id, status, created_at');

    let campaignsQuery = supabase
      .from('campaigns')
      .select('id, active');

    let salesQuery = supabase
      .from('sales')
      .select('value, date');

    // Filtrar por cliente se fornecido
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      campaignsQuery = campaignsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    const { data: campaigns, error: campaignsError } = await campaignsQuery;
    if (campaignsError) throw campaignsError;

    const { data: sales, error: salesError } = await salesQuery;
    if (salesError) throw salesError;

    // Calcular estatísticas
    const totalLeads = leads?.length || 0;
    const activeCampaigns = campaigns?.filter(c => c.active)?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const confirmedSales = sales?.length || 0;
    const conversionRate = totalLeads > 0 ? ((sales?.length || 0) / totalLeads) * 100 : 0;

    // Leads de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysLeads = leads?.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= today;
    }).length || 0;

    // Conversas pendentes (leads com status 'new' ou 'contacted')
    const pendingConversations = leads?.filter(lead => 
      lead.status === 'new' || lead.status === 'contacted'
    ).length || 0;

    // Leads do mês atual
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyLeads = leads?.filter(lead => {
      const leadDate = new Date(lead.created_at);
      return leadDate >= startOfMonth;
    }).length || 0;

    // Receita do mês atual
    const monthlyRevenue = sales?.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= startOfMonth;
    }).reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;

    return {
      totalLeads,
      totalSales: confirmedSales,
      totalRevenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      todaysLeads,
      confirmedSales,
      pendingConversations,
      monthlyLeads,
      monthlyRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      totalRevenue: 0,
      conversionRate: 0,
      todaysLeads: 0,
      confirmedSales: 0,
      pendingConversations: 0,
      monthlyLeads: 0,
      monthlyRevenue: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (days: number = 30, clientId?: string) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    let leadsQuery = supabase
      .from('leads')
      .select('id, status, created_at')
      .gte('created_at', dateFrom.toISOString());

    let salesQuery = supabase
      .from('sales')
      .select('value, date')
      .gte('date', dateFrom.toISOString());

    // Filtrar por cliente se fornecido
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await salesQuery;
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

export const getCampaignPerformance = async (clientId?: string) => {
  try {
    let leadsQuery = supabase
      .from('leads')
      .select('campaign, status, created_at');

    let salesQuery = supabase
      .from('sales')
      .select('campaign, value');

    // Filtrar por cliente se fornecido
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await salesQuery;
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

export const getMonthlyStats = async (clientId?: string) => {
  try {
    const currentDate = new Date();
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      
      let leadsQuery = supabase
        .from('leads')
        .select('id')
        .gte('created_at', date.toISOString())
        .lt('created_at', nextMonth.toISOString());

      let salesQuery = supabase
        .from('sales')
        .select('value')
        .gte('date', date.toISOString())
        .lt('date', nextMonth.toISOString());

      // Filtrar por cliente se fornecido
      if (clientId) {
        leadsQuery = leadsQuery.eq('client_id', clientId);
        salesQuery = salesQuery.eq('client_id', clientId);
      }

      const { data: leads, error: leadsError } = await leadsQuery;
      if (leadsError) throw leadsError;

      const { data: sales, error: salesError } = await salesQuery;
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

export const getTimelineData = async (clientId?: string) => {
  try {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - 30);

    let leadsQuery = supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', dateFrom.toISOString())
      .order('created_at');

    let salesQuery = supabase
      .from('sales')
      .select('date')
      .gte('date', dateFrom.toISOString())
      .order('date');

    // Filtrar por cliente se fornecido
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: leads, error: leadsError } = await leadsQuery;
    if (leadsError) throw leadsError;

    const { data: sales, error: salesError } = await salesQuery;
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
