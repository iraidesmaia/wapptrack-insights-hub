import { supabase } from "../integrations/supabase/client";
import { DashboardStats, TrendData, MonthlyStats } from "../types";

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
