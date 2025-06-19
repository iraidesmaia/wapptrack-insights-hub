
import { supabase } from "../integrations/supabase/client";
import { DashboardStats, CampaignPerformance, TimelineDataPoint, MonthlyStats, DateRange } from "../types";

export const getDashboardStats = async (clientId?: string): Promise<DashboardStats> => {
  try {
    console.log('🔄 dashboardService.getDashboardStats() - Iniciando busca...', { clientId });
    
    // Build queries with optional client_id filter
    let leadsQuery = supabase.from('leads').select('*');
    let salesQuery = supabase.from('sales').select('*');
    
    // Add client_id filter if provided
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const [
      { data: leads, error: leadsError },
      { data: sales, error: salesError }
    ] = await Promise.all([
      leadsQuery,
      salesQuery
    ]);

    if (leadsError) throw leadsError;
    if (salesError) throw salesError;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Calculate stats
    const totalLeads = leads?.length || 0;
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    const todaysLeads = leads?.filter(lead => 
      new Date(lead.created_at) >= startOfDay
    ).length || 0;

    const confirmedSales = sales?.filter(sale => 
      new Date(sale.date) >= startOfDay
    ).length || 0;

    const pendingConversations = leads?.filter(lead => 
      lead.status === 'new' || lead.status === 'contacted'
    ).length || 0;

    const monthlyLeads = leads?.filter(lead => 
      new Date(lead.created_at) >= startOfMonth
    ).length || 0;

    const monthlyRevenue = sales?.filter(sale => 
      new Date(sale.date) >= startOfMonth
    ).reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;

    console.log('✅ dashboardService.getDashboardStats() - Estatísticas calculadas:', {
      clientId,
      totalLeads,
      totalSales,
      totalRevenue,
      conversionRate
    });

    return {
      totalLeads,
      totalSales,
      conversionRate,
      totalRevenue,
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
      conversionRate: 0,
      totalRevenue: 0,
      todaysLeads: 0,
      confirmedSales: 0,
      pendingConversations: 0,
      monthlyLeads: 0,
      monthlyRevenue: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (dateRange: DateRange, clientId?: string): Promise<DashboardStats> => {
  try {
    console.log('🔄 dashboardService.getDashboardStatsByPeriod() - Iniciando busca...', { clientId, dateRange });
    
    // Build queries with optional client_id filter
    let leadsQuery = supabase
      .from('leads')
      .select('*')
      .gte('created_at', dateRange.startDate.toISOString())
      .lte('created_at', dateRange.endDate.toISOString());
    
    let salesQuery = supabase
      .from('sales')
      .select('*')
      .gte('date', dateRange.startDate.toISOString())
      .lte('date', dateRange.endDate.toISOString());
    
    // Add client_id filter if provided
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const [
      { data: leads, error: leadsError },
      { data: sales, error: salesError }
    ] = await Promise.all([
      leadsQuery,
      salesQuery
    ]);

    if (leadsError) throw leadsError;
    if (salesError) throw salesError;

    // Calculate stats for the period
    const totalLeads = leads?.length || 0;
    const totalSales = sales?.length || 0;
    const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalSales,
      conversionRate,
      totalRevenue,
      todaysLeads: totalLeads,
      confirmedSales: totalSales,
      pendingConversations: 0,
      monthlyLeads: totalLeads,
      monthlyRevenue: totalRevenue
    };
  } catch (error) {
    console.error("Error fetching dashboard stats by period:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      conversionRate: 0,
      totalRevenue: 0,
      todaysLeads: 0,
      confirmedSales: 0,
      pendingConversations: 0,
      monthlyLeads: 0,
      monthlyRevenue: 0
    };
  }
};

export const getCampaignPerformance = async (clientId?: string): Promise<CampaignPerformance[]> => {
  try {
    console.log('🔄 dashboardService.getCampaignPerformance() - Iniciando busca...', { clientId });
    
    // Build queries with optional client_id filter
    let leadsQuery = supabase.from('leads').select('campaign');
    let salesQuery = supabase.from('sales').select('campaign, value');
    
    // Add client_id filter if provided
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const [
      { data: leads, error: leadsError },
      { data: sales, error: salesError }
    ] = await Promise.all([
      leadsQuery,
      salesQuery
    ]);

    if (leadsError) throw leadsError;
    if (salesError) throw salesError;

    // Group data by campaign
    const campaignStats: { [key: string]: CampaignPerformance } = {};

    // Process leads
    leads?.forEach(lead => {
      if (!campaignStats[lead.campaign]) {
        campaignStats[lead.campaign] = {
          campaignId: lead.campaign,
          campaignName: lead.campaign,
          leads: 0,
          sales: 0,
          revenue: 0,
          conversionRate: 0
        };
      }
      campaignStats[lead.campaign].leads++;
    });

    // Process sales
    sales?.forEach(sale => {
      if (!campaignStats[sale.campaign]) {
        campaignStats[sale.campaign] = {
          campaignId: sale.campaign,
          campaignName: sale.campaign,
          leads: 0,
          sales: 0,
          revenue: 0,
          conversionRate: 0
        };
      }
      campaignStats[sale.campaign].sales++;
      campaignStats[sale.campaign].revenue += sale.value || 0;
    });

    // Calculate conversion rates
    Object.values(campaignStats).forEach(campaign => {
      campaign.conversionRate = campaign.leads > 0 ? (campaign.sales / campaign.leads) * 100 : 0;
    });

    return Object.values(campaignStats);
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};

export const getMonthlyStats = async (clientId?: string): Promise<MonthlyStats> => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Build queries with optional client_id filter
    let currentLeadsQuery = supabase
      .from('leads')
      .select('*')
      .gte('created_at', currentMonthStart.toISOString());
    
    let previousLeadsQuery = supabase
      .from('leads')
      .select('*')
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString());
    
    let currentSalesQuery = supabase
      .from('sales')
      .select('*')
      .gte('date', currentMonthStart.toISOString());
    
    let previousSalesQuery = supabase
      .from('sales')
      .select('*')
      .gte('date', previousMonthStart.toISOString())
      .lte('date', previousMonthEnd.toISOString());
    
    // Add client_id filter if provided
    if (clientId) {
      currentLeadsQuery = currentLeadsQuery.eq('client_id', clientId);
      previousLeadsQuery = previousLeadsQuery.eq('client_id', clientId);
      currentSalesQuery = currentSalesQuery.eq('client_id', clientId);
      previousSalesQuery = previousSalesQuery.eq('client_id', clientId);
    }

    const [
      { data: currentLeads, error: currentLeadsError },
      { data: previousLeads, error: previousLeadsError },
      { data: currentSales, error: currentSalesError },
      { data: previousSales, error: previousSalesError }
    ] = await Promise.all([
      currentLeadsQuery,
      previousLeadsQuery,
      currentSalesQuery,
      previousSalesQuery
    ]);

    if (currentLeadsError) throw currentLeadsError;
    if (previousLeadsError) throw previousLeadsError;
    if (currentSalesError) throw currentSalesError;
    if (previousSalesError) throw previousSalesError;

    return {
      currentMonth: {
        leads: currentLeads?.length || 0,
        revenue: currentSales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0
      },
      previousMonth: {
        leads: previousLeads?.length || 0,
        revenue: previousSales?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0
      }
    };
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return {
      currentMonth: { leads: 0, revenue: 0 },
      previousMonth: { leads: 0, revenue: 0 }
    };
  }
};

export const getTimelineData = async (days = 30, clientId?: string): Promise<TimelineDataPoint[]> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build queries with optional client_id filter
    let leadsQuery = supabase
      .from('leads')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());
    
    let salesQuery = supabase
      .from('sales')
      .select('date, value')
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());
    
    // Add client_id filter if provided
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const [
      { data: leads, error: leadsError },
      { data: sales, error: salesError }
    ] = await Promise.all([
      leadsQuery,
      salesQuery
    ]);

    if (leadsError) throw leadsError;
    if (salesError) throw salesError;

    // Group data by date
    const timeline: { [key: string]: TimelineDataPoint } = {};

    // Initialize all dates
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      timeline[dateStr] = {
        date: dateStr,
        leads: 0,
        sales: 0,
        revenue: 0
      };
    }

    // Count leads by date
    leads?.forEach(lead => {
      const dateStr = new Date(lead.created_at).toISOString().split('T')[0];
      if (timeline[dateStr]) {
        timeline[dateStr].leads++;
      }
    });

    // Count sales and revenue by date
    sales?.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      if (timeline[dateStr]) {
        timeline[dateStr].sales++;
        timeline[dateStr].revenue += sale.value || 0;
      }
    });

    return Object.values(timeline).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};
