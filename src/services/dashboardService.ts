import { DashboardStats, CampaignPerformance, MonthlyStats, TimelineDataPoint, TrendData } from "../types";
import { supabase } from "../integrations/supabase/client";

const formatDateForSupabase = (date: Date): string => {
  // Ensure we're working with a proper Date object and format it correctly for Supabase
  const validDate = new Date(date);
  return validDate.toISOString();
};

const getDateRangeForQueries = (startDate: Date, endDate: Date) => {
  // Create new Date objects to avoid mutation
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set start date to beginning of day
  start.setHours(0, 0, 0, 0);
  
  // Set end date to end of day
  end.setHours(23, 59, 59, 999);
  
  console.log('📅 Date range for queries:', {
    originalStart: startDate.toISOString(),
    originalEnd: endDate.toISOString(),
    adjustedStart: start.toISOString(),
    adjustedEnd: end.toISOString()
  });
  
  return {
    startISO: formatDateForSupabase(start),
    endISO: formatDateForSupabase(end)
  };
};

export const getDashboardStatsByPeriod = async (startDate: Date, endDate: Date): Promise<DashboardStats> => {
  try {
    console.log('🔍 getDashboardStatsByPeriod called with:', { startDate, endDate });
    
    const { startISO, endISO } = getDateRangeForQueries(startDate, endDate);

    // Fetch leads count for the period
    const { count: periodLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    console.log('📊 Period leads query result:', { periodLeads, leadsError });

    if (leadsError) {
      console.error('❌ Error fetching period leads:', leadsError);
      throw leadsError;
    }

    // Fetch sales data for the period
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('value, date')
      .gte('date', startISO)
      .lte('date', endISO);

    console.log('💰 Period sales query result:', { 
      salesCount: salesData?.length, 
      salesData: salesData?.slice(0, 3), 
      salesError 
    });

    if (salesError) {
      console.error('❌ Error fetching period sales:', salesError);
      throw salesError;
    }

    const periodSales = salesData?.length || 0;
    const periodRevenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const conversionRate = periodLeads > 0 ? periodSales / periodLeads : 0;

    // Calculate today's leads
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const { count: todaysLeads, error: todayLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', formatDateForSupabase(todayStart))
      .lte('created_at', formatDateForSupabase(todayEnd));

    console.log('📅 Today leads query result:', { todaysLeads, todayLeadsError });

    if (todayLeadsError) {
      console.error('❌ Error fetching today leads:', todayLeadsError);
      throw todayLeadsError;
    }

    // Calculate pending conversations
    const { count: pendingConversations, error: pendingError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    if (pendingError) {
      console.error('❌ Error fetching pending conversations:', pendingError);
      throw pendingError;
    }

    // Get monthly stats for trends
    const monthlyStats = await getMonthlyStats();

    const result = {
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

    console.log('✅ Dashboard stats result:', result);
    return result;
  } catch (error) {
    console.error("❌ Error fetching dashboard stats by period:", error);
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

export const getTimelineData = async (startDate: Date, endDate: Date): Promise<TimelineDataPoint[]> => {
  try {
    console.log('📈 getTimelineData called with:', { startDate, endDate });
    
    const data: TimelineDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dayStartISO = formatDateForSupabase(dayStart);
      const dayEndISO = formatDateForSupabase(dayEnd);

      // Get leads for this day
      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStartISO)
        .lte('created_at', dayEndISO);

      if (leadsError) {
        console.error('❌ Error fetching daily leads:', leadsError);
        throw leadsError;
      }

      // Get sales for this day
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('value')
        .gte('date', dayStartISO)
        .lte('date', dayEndISO);

      if (salesError) {
        console.error('❌ Error fetching daily sales:', salesError);
        throw salesError;
      }

      const salesCount = salesData?.length || 0;
      const revenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;

      const dayData = {
        date: currentDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        leads: leadsCount || 0,
        sales: salesCount,
        revenue
      };

      console.log(`📊 Day ${dayData.date}:`, dayData);
      data.push(dayData);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    console.log('✅ Timeline data result:', { totalDays: data.length, firstDay: data[0], lastDay: data[data.length - 1] });
    return data;
  } catch (error) {
    console.error("❌ Error fetching timeline data:", error);
    return [];
  }
};

export const getMonthlyStats = async (): Promise<MonthlyStats & { trends: { leads: TrendData; revenue: TrendData; sales: TrendData } }> => {
  try {
    console.log('📅 getMonthlyStats called');
    
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);
    
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    previousMonthEnd.setHours(23, 59, 59, 999);

    const currentMonthStartISO = formatDateForSupabase(currentMonthStart);
    const currentMonthEndISO = formatDateForSupabase(currentMonthEnd);
    const previousMonthStartISO = formatDateForSupabase(previousMonthStart);
    const previousMonthEndISO = formatDateForSupabase(previousMonthEnd);

    console.log('📅 Monthly date ranges:', {
      currentMonth: { start: currentMonthStartISO, end: currentMonthEndISO },
      previousMonth: { start: previousMonthStartISO, end: previousMonthEndISO }
    });

    // Current month leads
    const { count: currentLeads, error: currentLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonthStartISO)
      .lte('created_at', currentMonthEndISO);

    if (currentLeadsError) throw currentLeadsError;

    // Previous month leads
    const { count: previousLeads, error: previousLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonthStartISO)
      .lte('created_at', previousMonthEndISO);

    if (previousLeadsError) throw previousLeadsError;

    // Current month sales
    const { data: currentSalesData, error: currentSalesError } = await supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonthStartISO)
      .lte('date', currentMonthEndISO);

    if (currentSalesError) throw currentSalesError;

    // Previous month sales
    const { data: previousSalesData, error: previousSalesError } = await supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonthStartISO)
      .lte('date', previousMonthEndISO);

    if (previousSalesError) throw previousSalesError;

    const currentRevenue = currentSalesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const previousRevenue = previousSalesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const currentSales = currentSalesData?.length || 0;
    const previousSales = previousSalesData?.length || 0;

    // Calculate trends
    const leadsTrend = calculateTrend(currentLeads || 0, previousLeads || 0);
    const revenueTrend = calculateTrend(currentRevenue, previousRevenue);
    const salesTrend = calculateTrend(currentSales, previousSales);

    const result = {
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

    console.log('✅ Monthly stats result:', result);
    return result;
  } catch (error) {
    console.error("❌ Error fetching monthly stats:", error);
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

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    // Fetch total leads count
    const { count: totalLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });

    if (leadsError) throw leadsError;

    // Fetch total sales count and revenue
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('value');

    if (salesError) throw salesError;

    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const conversionRate = totalLeads > 0 ? totalSales / totalLeads : 0;

    // Calculate today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todaysLeads, error: todayLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (todayLeadsError) throw todayLeadsError;

    // Calculate confirmed sales (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);

    const { count: confirmedSales, error: confirmedSalesError } = await supabase
      .from('sales')
      .select('*', { count: 'exact', head: true })
      .gte('date', last7Days.toISOString());

    if (confirmedSalesError) throw confirmedSalesError;

    // Calculate pending conversations
    const { count: pendingConversations, error: pendingError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    if (pendingError) throw pendingError;

    // Get monthly stats for trends
    const monthlyStats = await getMonthlyStats();

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

export const getCampaignPerformance = async (): Promise<CampaignPerformance[]> => {
  try {
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;

    if (!campaigns) return [];

    const performanceData: CampaignPerformance[] = [];

    for (const campaign of campaigns) {
      const campaignName = campaign.name;

      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign', campaignName);

      if (leadsError) throw leadsError;

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('value')
        .eq('campaign', campaignName);

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
