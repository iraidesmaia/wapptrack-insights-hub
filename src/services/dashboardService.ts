import { DashboardStats, CampaignPerformance, MonthlyStats, TimelineDataPoint, TrendData } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getDashboardStatsByPeriod = async (startDate: Date, endDate: Date, clientId?: string | null): Promise<DashboardStats> => {
  try {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Fetch leads count for the period
    let leadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lte('created_at', endISO);
    
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
    }

    const { count: periodLeads, error: leadsError } = await leadsQuery;

    if (leadsError) throw leadsError;

    // Fetch sales data for the period
    let salesQuery = supabase
      .from('sales')
      .select('value')
      .gte('date', startISO)
      .lte('date', endISO);
    
    if (clientId) {
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    const periodSales = salesData?.length || 0;
    const periodRevenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const conversionRate = periodLeads > 0 ? periodSales / periodLeads : 0;

    // Calculate today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let todayLeadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    if (clientId) {
      todayLeadsQuery = todayLeadsQuery.eq('client_id', clientId);
    }

    const { count: todaysLeads, error: todayLeadsError } = await todayLeadsQuery;

    if (todayLeadsError) throw todayLeadsError;

    // Calculate pending conversations
    let pendingQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);
    
    if (clientId) {
      pendingQuery = pendingQuery.eq('client_id', clientId);
    }

    const { count: pendingConversations, error: pendingError } = await pendingQuery;

    if (pendingError) throw pendingError;

    // Get monthly stats for trends
    const monthlyStats = await getMonthlyStats(clientId);

    return {
      totalLeads: periodLeads || 0,
      totalSales: periodSales,
      conversionRate,
      totalRevenue: periodRevenue,
      todaysLeads: todaysLeads || 0,
      confirmedSales: periodSales,
      pendingConversations: pendingConversations || 0,
      monthlyLeads: monthlyStats.currentMonth.leads,
      monthlyRevenue: monthlyStats.currentMonth.revenue,
      monthlyLeadsTrend: monthlyStats.trends.leads,
      monthlyRevenueTrend: monthlyStats.trends.revenue
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
      monthlyRevenue: 0,
      monthlyLeadsTrend: { trend: 'flat', percentage: 0 },
      monthlyRevenueTrend: { trend: 'flat', percentage: 0 }
    };
  }
};

export const getMonthlyStats = async (clientId?: string | null): Promise<MonthlyStats & { trends: { leads: TrendData; revenue: TrendData; sales: TrendData } }> => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month leads
    let currentLeadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString());
    
    if (clientId) {
      currentLeadsQuery = currentLeadsQuery.eq('client_id', clientId);
    }

    const { count: currentLeads, error: currentLeadsError } = await currentLeadsQuery;

    if (currentLeadsError) throw currentLeadsError;

    // Previous month leads
    let previousLeadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString());
    
    if (clientId) {
      previousLeadsQuery = previousLeadsQuery.eq('client_id', clientId);
    }

    const { count: previousLeads, error: previousLeadsError } = await previousLeadsQuery;

    if (previousLeadsError) throw previousLeadsError;

    // Current month sales
    let currentSalesQuery = supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonthStart.toISOString())
      .lte('date', currentMonthEnd.toISOString());
    
    if (clientId) {
      currentSalesQuery = currentSalesQuery.eq('client_id', clientId);
    }

    const { data: currentSalesData, error: currentSalesError } = await currentSalesQuery;

    if (currentSalesError) throw currentSalesError;

    // Previous month sales
    let previousSalesQuery = supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonthStart.toISOString())
      .lte('date', previousMonthEnd.toISOString());
    
    if (clientId) {
      previousSalesQuery = previousSalesQuery.eq('client_id', clientId);
    }

    const { data: previousSalesData, error: previousSalesError } = await previousSalesQuery;

    if (previousSalesError) throw previousSalesError;

    const currentRevenue = currentSalesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const previousRevenue = previousSalesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const currentSales = currentSalesData?.length || 0;
    const previousSales = previousSalesData?.length || 0;

    // Calculate trends
    const leadsTrend = calculateTrend(currentLeads || 0, previousLeads || 0);
    const revenueTrend = calculateTrend(currentRevenue, previousRevenue);
    const salesTrend = calculateTrend(currentSales, previousSales);

    return {
      currentMonth: {
        leads: currentLeads || 0,
        revenue: currentRevenue
      },
      previousMonth: {
        leads: previousLeads || 0,
        revenue: previousRevenue
      },
      trends: {
        leads: leadsTrend,
        revenue: revenueTrend,
        sales: salesTrend
      }
    };
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return {
      currentMonth: { leads: 0, revenue: 0 },
      previousMonth: { leads: 0, revenue: 0 },
      trends: {
        leads: { trend: 'flat', percentage: 0 },
        revenue: { trend: 'flat', percentage: 0 },
        sales: { trend: 'flat', percentage: 0 }
      }
    };
  }
};

export const getTimelineData = async (startDate: Date, endDate: Date, clientId?: string | null): Promise<TimelineDataPoint[]> => {
  try {
    const data: TimelineDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Get leads for this day
      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());
      
      if (clientId) {
        leadsQuery = leadsQuery.eq('client_id', clientId);
      }

      const { count: leadsCount, error: leadsError } = await leadsQuery;

      if (leadsError) throw leadsError;

      // Get sales for this day
      let salesQuery = supabase
        .from('sales')
        .select('value')
        .gte('date', dayStart.toISOString())
        .lte('date', dayEnd.toISOString());
      
      if (clientId) {
        salesQuery = salesQuery.eq('client_id', clientId);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      const salesCount = salesData?.length || 0;
      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;

      data.push({
        date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: leadsCount || 0,
        sales: salesCount,
        revenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return data;
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};

const calculateTrend = (current: number, previous: number): TrendData => {
  if (previous === 0) {
    return {
      trend: current > 0 ? 'up' : 'flat',
      percentage: current > 0 ? 100 : 0
    };
  }

  const percentage = ((current - previous) / previous) * 100;
  
  return {
    trend: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'flat',
    percentage: Math.abs(percentage)
  };
};

export const getDashboardStats = async (clientId?: string | null): Promise<DashboardStats> => {
  try {
    // Fetch total leads count
    let leadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (clientId) {
      leadsQuery = leadsQuery.eq('client_id', clientId);
    }

    const { count: totalLeads, error: leadsError } = await leadsQuery;

    if (leadsError) throw leadsError;

    // Fetch total sales count and revenue
    let salesQuery = supabase
      .from('sales')
      .select('value');
    
    if (clientId) {
      salesQuery = salesQuery.eq('client_id', clientId);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) throw salesError;

    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const conversionRate = totalLeads > 0 ? totalSales / totalLeads : 0;

    // Calculate today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todayLeadsQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    
    if (clientId) {
      todayLeadsQuery = todayLeadsQuery.eq('client_id', clientId);
    }

    const { count: todaysLeads, error: todayLeadsError } = await todayLeadsQuery;

    if (todayLeadsError) throw todayLeadsError;

    // Calculate confirmed sales (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    let confirmedSalesQuery = supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .gte('date', last7Days.toISOString());
    
    if (clientId) {
      confirmedSalesQuery = confirmedSalesQuery.eq('client_id', clientId);
    }

    const { count: confirmedSales, error: confirmedSalesError } = await confirmedSalesQuery;

    if (confirmedSalesError) throw confirmedSalesError;

    // Calculate pending conversations
    let pendingQuery = supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);
    
    if (clientId) {
      pendingQuery = pendingQuery.eq('client_id', clientId);
    }

    const { count: pendingConversations, error: pendingError } = await pendingQuery;

    if (pendingError) throw pendingError;

    // Get monthly stats for trends
    const monthlyStats = await getMonthlyStats(clientId);

    return {
      totalLeads: totalLeads || 0,
      totalSales,
      conversionRate,
      totalRevenue,
      todaysLeads: todaysLeads || 0,
      confirmedSales: confirmedSales || 0,
      pendingConversations: pendingConversations || 0,
      monthlyLeads: monthlyStats.currentMonth.leads,
      monthlyRevenue: monthlyStats.currentMonth.revenue,
      monthlyLeadsTrend: monthlyStats.trends.leads,
      monthlyRevenueTrend: monthlyStats.trends.revenue
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
      monthlyRevenue: 0,
      monthlyLeadsTrend: { trend: 'flat', percentage: 0 },
      monthlyRevenueTrend: { trend: 'flat', percentage: 0 }
    };
  }
};

export const getCampaignPerformance = async (clientId?: string | null): Promise<CampaignPerformance[]> => {
  try {
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*');
    
    if (clientId) {
      campaignsQuery = campaignsQuery.eq('client_id', clientId);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery;

    if (campaignsError) throw campaignsError;

    if (!campaigns) return [];

    const performanceData: CampaignPerformance[] = [];

    for (const campaign of campaigns) {
      const campaignName = campaign.name;

      let leadsQuery = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign', campaignName);
      
      if (clientId) {
        leadsQuery = leadsQuery.eq('client_id', clientId);
      }

      const { count: leadsCount, error: leadsError } = await leadsQuery;

      if (leadsError) throw leadsError;

      let salesQuery = supabase
        .from('sales')
        .select('value')
        .eq('campaign', campaignName);
      
      if (clientId) {
        salesQuery = salesQuery.eq('client_id', clientId);
      }

      const { data: salesData, error: salesError } = await salesQuery;

      if (salesError) throw salesError;

      const salesCount = salesData?.length || 0;
      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
      
      performanceData.push({
        campaignId: campaign.id,
        campaignName,
        leads: leadsCount || 0,
        sales: salesCount,
        revenue,
        conversionRate: leadsCount > 0 ? salesCount / leadsCount : 0
      });
    }

    return performanceData;

  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};
