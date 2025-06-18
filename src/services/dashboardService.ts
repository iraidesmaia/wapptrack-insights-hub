import { supabase } from "../integrations/supabase/client";
import { DashboardStats, TrendData, MonthlyStats, CampaignPerformance, TimelineDataPoint } from "../types";

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Get current month's leads
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonth.toISOString());

    // Get previous month's leads for trend calculation
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const { count: previousMonthLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    // Get sales data
    const { data: sales, count: confirmedSales } = await supabase
      .from('sales')
      .select('value', { count: 'exact' });

    // Calculate monthly revenue
    const { data: monthlySales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonth.toISOString());

    const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get previous month's revenue for trend calculation
    const { data: previousMonthSales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonth.toISOString())
      .lt('date', currentMonth.toISOString());

    const previousMonthRevenue = previousMonthSales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get pending conversations (leads with status 'new' or 'contacted')
    const { count: pendingConversations } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    // Calculate conversion rate
    const conversionRate = totalLeads && totalLeads > 0 
      ? Math.round(((confirmedSales || 0) / totalLeads) * 100 * 100) / 100 
      : 0;

    // Calculate trends
    const monthlyLeadsTrend: TrendData = calculateTrend(monthlyLeads || 0, previousMonthLeads || 0);
    const monthlyRevenueTrend: TrendData = calculateTrend(monthlyRevenue, previousMonthRevenue);

    return {
      totalLeads: totalLeads || 0,
      monthlyLeads: monthlyLeads || 0,
      monthlyLeadsTrend,
      confirmedSales: confirmedSales || 0,
      monthlyRevenue,
      monthlyRevenueTrend,
      pendingConversations: pendingConversations || 0,
      conversionRate
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalLeads: 0,
      monthlyLeads: 0,
      confirmedSales: 0,
      monthlyRevenue: 0,
      pendingConversations: 0,
      conversionRate: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (startDate: Date, endDate: Date): Promise<DashboardStats> => {
  try {
    // Get leads for the period
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    // Get current month's leads
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonth.toISOString());

    // Get previous month for trend
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const { count: previousMonthLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    // Get sales data
    const { data: sales, count: confirmedSales } = await supabase
      .from('sales')
      .select('value', { count: 'exact' })
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    // Calculate monthly revenue
    const { data: monthlySales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonth.toISOString());

    const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get previous month's revenue
    const { data: previousMonthSales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonth.toISOString())
      .lt('date', currentMonth.toISOString());

    const previousMonthRevenue = previousMonthSales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get pending conversations
    const { count: pendingConversations } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    // Calculate conversion rate
    const conversionRate = totalLeads && totalLeads > 0 
      ? Math.round(((confirmedSales || 0) / totalLeads) * 100 * 100) / 100 
      : 0;

    // Calculate trends
    const monthlyLeadsTrend: TrendData = calculateTrend(monthlyLeads || 0, previousMonthLeads || 0);
    const monthlyRevenueTrend: TrendData = calculateTrend(monthlyRevenue, previousMonthRevenue);

    return {
      totalLeads: totalLeads || 0,
      monthlyLeads: monthlyLeads || 0,
      monthlyLeadsTrend,
      confirmedSales: confirmedSales || 0,
      monthlyRevenue,
      monthlyRevenueTrend,
      pendingConversations: pendingConversations || 0,
      conversionRate
    };
  } catch (error) {
    console.error("Error fetching dashboard stats by period:", error);
    return {
      totalLeads: 0,
      monthlyLeads: 0,
      confirmedSales: 0,
      monthlyRevenue: 0,
      pendingConversations: 0,
      conversionRate: 0
    };
  }
};

const calculateTrend = (current: number, previous: number): TrendData => {
  if (previous === 0) {
    return current > 0 ? { trend: 'up', percentage: 100 } : { trend: 'flat', percentage: 0 };
  }
  
  const percentage = ((current - previous) / previous) * 100;
  
  if (percentage > 0) {
    return { trend: 'up', percentage: Math.round(percentage * 100) / 100 };
  } else if (percentage < 0) {
    return { trend: 'down', percentage: Math.round(Math.abs(percentage) * 100) / 100 };
  } else {
    return { trend: 'flat', percentage: 0 };
  }
};

export const getCampaignPerformance = async (): Promise<CampaignPerformance[]> => {
  try {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name');

    if (!campaigns) return [];

    const performance: CampaignPerformance[] = [];

    for (const campaign of campaigns) {
      // Get leads for this campaign
      const { count: leads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);

      // Get sales for this campaign
      const { data: salesData, count: sales } = await supabase
        .from('sales')
        .select('value', { count: 'exact' })
        .eq('campaign', campaign.name);

      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
      const conversionRate = leads && leads > 0 ? Math.round(((sales || 0) / leads) * 100 * 100) / 100 : 0;

      performance.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        leads: leads || 0,
        sales: sales || 0,
        revenue,
        conversionRate
      });
    }

    return performance;
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};

export const getTimelineData = async (startDate: Date, endDate: Date): Promise<TimelineDataPoint[]> => {
  try {
    const timeline: TimelineDataPoint[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get leads for this day
      const { count: leads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', currentDate.toISOString())
        .lt('created_at', nextDay.toISOString());

      // Get sales for this day
      const { data: salesData, count: sales } = await supabase
        .from('sales')
        .select('value', { count: 'exact' })
        .gte('date', currentDate.toISOString())
        .lt('date', nextDay.toISOString());

      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;

      timeline.push({
        date: currentDate.toISOString().split('T')[0],
        leads: leads || 0,
        sales: sales || 0,
        revenue
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return timeline;
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};

export const getMonthlyStats = async (): Promise<MonthlyStats[]> => {
  try {
    const months = [];
    const currentDate = new Date();
    
    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      
      // Get leads count for this month
      const { count: leads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', date.toISOString())
        .lt('created_at', nextMonth.toISOString());

      // Get sales for this month
      const { data: salesData, count: sales } = await supabase
        .from('sales')
        .select('value', { count: 'exact' })
        .gte('date', date.toISOString())
        .lt('date', nextMonth.toISOString());

      // Calculate total revenue for this month
      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;

      months.push({
        leads: leads || 0,
        sales: sales || 0,
        revenue
      });
    }
    
    return months;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
};

export const getEnhancedDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Get total leads
    const { count: totalLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    // Get current month's leads
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const { count: monthlyLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonth.toISOString());

    // Get previous month's leads for trend calculation
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const { count: previousMonthLeads } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    // Get sales data
    const { data: sales, count: confirmedSales } = await supabase
      .from('sales')
      .select('value', { count: 'exact' });

    // Calculate monthly revenue
    const { data: monthlySales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonth.toISOString());

    const monthlyRevenue = monthlySales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get previous month's revenue for trend calculation
    const { data: previousMonthSales } = await supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonth.toISOString())
      .lt('date', currentMonth.toISOString());

    const previousMonthRevenue = previousMonthSales?.reduce((sum, sale) => sum + sale.value, 0) || 0;

    // Get pending conversations (leads with status 'new' or 'contacted')
    const { count: pendingConversations } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    // Calculate conversion rate
    const conversionRate = totalLeads && totalLeads > 0 
      ? Math.round(((confirmedSales || 0) / totalLeads) * 100 * 100) / 100 
      : 0;

    // Calculate trends
    const monthlyLeadsTrend: TrendData = calculateTrend(monthlyLeads || 0, previousMonthLeads || 0);
    const monthlyRevenueTrend: TrendData = calculateTrend(monthlyRevenue, previousMonthRevenue);

    return {
      totalLeads: totalLeads || 0,
      monthlyLeads: monthlyLeads || 0,
      monthlyLeadsTrend,
      confirmedSales: confirmedSales || 0,
      monthlyRevenue,
      monthlyRevenueTrend,
      pendingConversations: pendingConversations || 0,
      conversionRate
    };
  } catch (error) {
    console.error("Error fetching enhanced dashboard stats:", error);
    return {
      totalLeads: 0,
      monthlyLeads: 0,
      confirmedSales: 0,
      monthlyRevenue: 0,
      pendingConversations: 0,
      conversionRate: 0
    };
  }
};
