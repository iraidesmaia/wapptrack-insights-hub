
import { supabase } from "../integrations/supabase/client";

interface DashboardStats {
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  totalCampaigns: number;
  conversionRate: number;
}

interface CampaignPerformance {
  campaign: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

interface MonthlyStats {
  month: string;
  leads: number;
  sales: number;
  revenue: number;
}

interface TimelineData {
  date: string;
  leads: number;
  sales: number;
}

export const getDashboardStats = async (projectId: string): Promise<DashboardStats> => {
  try {
    // Fetch leads count
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId);

    // Fetch sales data
    const { data: salesData } = await supabase
      .from('sales')
      .select('value')
      .eq('project_id', projectId);

    // Fetch campaigns count
    const { count: campaignsCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('active', true);

    const totalLeads = leadsCount || 0;
    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const totalCampaigns = campaignsCount || 0;
    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalSales,
      totalRevenue,
      totalCampaigns,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalCampaigns: 0,
      conversionRate: 0
    };
  }
};

export const getDashboardStatsByPeriod = async (projectId: string, startDate: string, endDate: string): Promise<DashboardStats> => {
  try {
    const { count: leadsCount } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const { data: salesData } = await supabase
      .from('sales')
      .select('value')
      .eq('project_id', projectId)
      .gte('date', startDate)
      .lte('date', endDate);

    const { count: campaignsCount } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('active', true)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    const totalLeads = leadsCount || 0;
    const totalSales = salesData?.length || 0;
    const totalRevenue = salesData?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
    const totalCampaigns = campaignsCount || 0;
    const conversionRate = totalLeads > 0 ? (totalSales / totalLeads) * 100 : 0;

    return {
      totalLeads,
      totalSales,
      totalRevenue,
      totalCampaigns,
      conversionRate: Math.round(conversionRate * 100) / 100
    };
  } catch (error) {
    console.error("Error fetching dashboard stats by period:", error);
    return {
      totalLeads: 0,
      totalSales: 0,
      totalRevenue: 0,
      totalCampaigns: 0,
      conversionRate: 0
    };
  }
};

export const getCampaignPerformance = async (projectId: string): Promise<CampaignPerformance[]> => {
  try {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('name')
      .eq('project_id', projectId)
      .eq('active', true);

    if (!campaigns) return [];

    const performanceData = await Promise.all(
      campaigns.map(async (campaign) => {
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', projectId)
          .eq('campaign', campaign.name);

        const { data: salesData } = await supabase
          .from('sales')
          .select('value')
          .eq('project_id', projectId)
          .eq('campaign', campaign.name);

        const leads = leadsCount || 0;
        const sales = salesData?.length || 0;
        const revenue = salesData?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0;
        const conversionRate = leads > 0 ? (sales / leads) * 100 : 0;

        return {
          campaign: campaign.name,
          leads,
          sales,
          revenue,
          conversionRate: Math.round(conversionRate * 100) / 100
        };
      })
    );

    return performanceData.sort((a, b) => b.leads - a.leads);
  } catch (error) {
    console.error("Error fetching campaign performance:", error);
    return [];
  }
};

export const getMonthlyStats = async (projectId: string): Promise<MonthlyStats[]> => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    
    const monthlyData: MonthlyStats[] = [];
    
    for (let i = 0; i < 6; i++) {
      const currentMonth = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth() + i, 1);
      const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
      
      const monthStr = currentMonth.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', currentMonth.toISOString())
        .lt('created_at', nextMonth.toISOString());

      const { data: salesData } = await supabase
        .from('sales')
        .select('value')
        .eq('project_id', projectId)
        .gte('date', currentMonth.toISOString())
        .lt('date', nextMonth.toISOString());

      monthlyData.push({
        month: monthStr,
        leads: leadsCount || 0,
        sales: salesData?.length || 0,
        revenue: salesData?.reduce((sum, sale) => sum + (sale.value || 0), 0) || 0
      });
    }

    return monthlyData;
  } catch (error) {
    console.error("Error fetching monthly stats:", error);
    return [];
  }
};

export const getTimelineData = async (projectId: string, startDate: string, endDate: string): Promise<TimelineData[]> => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    const timelineData: TimelineData[] = [];
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
      const nextDate = new Date(currentDate.getTime() + (24 * 60 * 60 * 1000));
      
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('created_at', currentDate.toISOString())
        .lt('created_at', nextDate.toISOString());

      const { count: salesCount } = await supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .gte('date', currentDate.toISOString())
        .lt('date', nextDate.toISOString());

      timelineData.push({
        date: dateStr,
        leads: leadsCount || 0,
        sales: salesCount || 0
      });
    }

    return timelineData;
  } catch (error) {
    console.error("Error fetching timeline data:", error);
    return [];
  }
};
