import { Campaign, Lead, Sale, DashboardStats, CampaignPerformance, MonthlyStats, TimelineDataPoint, TrendData } from "../types";
import { generateId } from "../lib/utils";
import { supabase } from "../integrations/supabase/client";

// Lead methods
export const getLeads = async (): Promise<Lead[]> => {
  try {
    // Fetch leads from Supabase
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map database fields to our Lead interface
    return (leads || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      campaign: lead.campaign,
      status: lead.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
      created_at: lead.created_at,
      custom_fields: lead.custom_fields as Record<string, string>,
      notes: lead.notes,
      first_contact_date: lead.first_contact_date,
      last_contact_date: lead.last_contact_date
    }));
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
};

export const addLead = async (lead: Omit<Lead, 'id' | 'created_at'>): Promise<Lead> => {
  try {
    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert({
        name: lead.name,
        phone: lead.phone,
        campaign: lead.campaign,
        status: lead.status || 'new',
        custom_fields: lead.custom_fields || {},
        notes: lead.notes || '',
        first_contact_date: lead.first_contact_date || null,
        last_contact_date: lead.last_contact_date || null
      })
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Lead type
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date
    };
  } catch (error) {
    console.error("Error adding lead:", error);
    throw error;
  }
};

export const updateLead = async (id: string, lead: Partial<Lead>): Promise<Lead> => {
  try {
    // Prepare the update data
    const updateData: any = {};
    if (lead.name) updateData.name = lead.name;
    if (lead.phone) updateData.phone = lead.phone;
    if (lead.campaign) updateData.campaign = lead.campaign;
    if (lead.status) updateData.status = lead.status;
    if (lead.custom_fields) updateData.custom_fields = lead.custom_fields;
    if (lead.notes) updateData.notes = lead.notes;
    if (lead.first_contact_date !== undefined) updateData.first_contact_date = lead.first_contact_date;
    if (lead.last_contact_date !== undefined) updateData.last_contact_date = lead.last_contact_date;

    // Update lead in Supabase
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Lead type
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as 'new' | 'contacted' | 'qualified' | 'converted' | 'lost',
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date
    };
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    // Delete lead from Supabase
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting lead:", error);
    throw error;
  }
};

// Campaign methods
export const getCampaigns = async (): Promise<Campaign[]> => {
  try {
    // Fetch campaigns from Supabase
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Format the returned data to match the Campaign type
    return (campaigns || []).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_content: campaign.utm_content,
      utm_term: campaign.utm_term,
      pixel_id: campaign.pixel_id,
      whatsapp_number: campaign.whatsapp_number,
      event_type: campaign.event_type as 'contact' | 'lead' | 'page_view' | 'sale',
      active: campaign.active,
      created_at: campaign.created_at,
      custom_message: campaign.custom_message,
      company_title: campaign.company_title,
      company_subtitle: campaign.company_subtitle,
      logo_url: campaign.logo_url,
      redirect_type: (campaign.redirect_type as 'whatsapp' | 'form') || 'whatsapp',
      pixel_integration_type: (campaign.pixel_integration_type as 'direct' | 'form') || 'direct'
    }));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
};

export const addCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at'>): Promise<Campaign> => {
  try {
    // Insert campaign into Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: campaign.name,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        pixel_id: campaign.pixel_id,
        whatsapp_number: campaign.whatsapp_number,
        event_type: campaign.event_type,
        active: campaign.active,
        custom_message: campaign.custom_message,
        company_title: campaign.company_title,
        company_subtitle: campaign.company_subtitle,
        logo_url: campaign.logo_url,
        redirect_type: campaign.redirect_type || 'whatsapp',
        pixel_integration_type: campaign.pixel_integration_type || 'direct'
      })
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Campaign type
    return {
      id: data.id,
      name: data.name,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      pixel_id: data.pixel_id,
      whatsapp_number: data.whatsapp_number,
      event_type: data.event_type as 'contact' | 'lead' | 'page_view' | 'sale',
      active: data.active,
      created_at: data.created_at,
      custom_message: data.custom_message,
      company_title: data.company_title,
      company_subtitle: data.company_subtitle,
      logo_url: data.logo_url,
      redirect_type: (data.redirect_type as 'whatsapp' | 'form') || 'whatsapp',
      pixel_integration_type: (data.pixel_integration_type as 'direct' | 'form') || 'direct'
    };
  } catch (error) {
    console.error("Error adding campaign:", error);
    throw error;
  }
};

export const updateCampaign = async (id: string, campaign: Partial<Campaign>): Promise<Campaign> => {
  try {
    // Prepare the update data
    const updateData: any = {};
    if (campaign.name) updateData.name = campaign.name;
    if (campaign.utm_source !== undefined) updateData.utm_source = campaign.utm_source;
    if (campaign.utm_medium !== undefined) updateData.utm_medium = campaign.utm_medium;
    if (campaign.utm_campaign !== undefined) updateData.utm_campaign = campaign.utm_campaign;
    if (campaign.utm_content !== undefined) updateData.utm_content = campaign.utm_content;
    if (campaign.utm_term !== undefined) updateData.utm_term = campaign.utm_term;
    if (campaign.pixel_id !== undefined) updateData.pixel_id = campaign.pixel_id;
    if (campaign.whatsapp_number !== undefined) updateData.whatsapp_number = campaign.whatsapp_number;
    if (campaign.event_type !== undefined) updateData.event_type = campaign.event_type;
    if (campaign.active !== undefined) updateData.active = campaign.active;
    if (campaign.custom_message !== undefined) updateData.custom_message = campaign.custom_message;
    if (campaign.company_title !== undefined) updateData.company_title = campaign.company_title;
    if (campaign.company_subtitle !== undefined) updateData.company_subtitle = campaign.company_subtitle;
    if (campaign.logo_url !== undefined) updateData.logo_url = campaign.logo_url;
    if (campaign.redirect_type !== undefined) updateData.redirect_type = campaign.redirect_type;
    if (campaign.pixel_integration_type !== undefined) updateData.pixel_integration_type = campaign.pixel_integration_type;

    // Update campaign in Supabase
    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Campaign type
    return {
      id: data.id,
      name: data.name,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      pixel_id: data.pixel_id,
      whatsapp_number: data.whatsapp_number,
      event_type: data.event_type as 'contact' | 'lead' | 'page_view' | 'sale',
      active: data.active,
      created_at: data.created_at,
      custom_message: data.custom_message,
      company_title: data.company_title,
      company_subtitle: data.company_subtitle,
      logo_url: data.logo_url,
      redirect_type: (data.redirect_type as 'whatsapp' | 'form') || 'whatsapp',
      pixel_integration_type: (data.pixel_integration_type as 'direct' | 'form') || 'direct'
    };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
    // Check if campaign is used in leads
    const { data: usedLeads, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('campaign_id', id)
      .limit(1);

    if (checkError) throw checkError;

    if (usedLeads && usedLeads.length > 0) {
      throw new Error('Esta campanha não pode ser excluída pois está sendo usada por leads');
    }

    // Delete campaign from Supabase
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting campaign:", error);
    throw error;
  }
};

// Sale methods
export const getSales = async (): Promise<Sale[]> => {
  try {
    // Fetch sales from Supabase
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    // Format the returned data to match the Sale type
    return (sales || []).map(sale => ({
      id: sale.id,
      value: sale.value,
      date: sale.date,
      lead_id: sale.lead_id,
      lead_name: sale.lead_name,
      campaign: sale.campaign,
      product: sale.product,
      notes: sale.notes
    }));
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  try {
    // Insert sale into Supabase
    const { data, error } = await supabase
      .from('sales')
      .insert({
        value: sale.value,
        date: sale.date,
        lead_id: sale.lead_id,
        lead_name: sale.lead_name,
        campaign: sale.campaign,
        product: sale.product,
        notes: sale.notes
      })
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Sale type
    return {
      id: data.id,
      value: data.value,
      date: data.date,
      lead_id: data.lead_id,
      lead_name: data.lead_name,
      campaign: data.campaign,
      product: data.product,
      notes: data.notes
    };
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  try {
    // Prepare the update data
    const updateData: any = {};
    if (sale.value !== undefined) updateData.value = sale.value;
    if (sale.date) updateData.date = sale.date;
    if (sale.lead_id) updateData.lead_id = sale.lead_id;
    if (sale.lead_name) updateData.lead_name = sale.lead_name;
    if (sale.campaign) updateData.campaign = sale.campaign;
    if (sale.product !== undefined) updateData.product = sale.product;
    if (sale.notes !== undefined) updateData.notes = sale.notes;

    // Update sale in Supabase
    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Format the returned data to match the Sale type
    return {
      id: data.id,
      value: data.value,
      date: data.date,
      lead_id: data.lead_id,
      lead_name: data.lead_name,
      campaign: data.campaign,
      product: data.product,
      notes: data.notes
    };
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    // Delete sale from Supabase
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};

// New enhanced dashboard methods
export const getDashboardStatsByPeriod = async (startDate: Date, endDate: Date): Promise<DashboardStats> => {
  try {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();

    // Fetch leads count for the period
    const { count: periodLeads, error: leadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startISO)
      .lte('created_at', endISO);

    if (leadsError) throw leadsError;

    // Fetch sales data for the period
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('value')
      .gte('date', startISO)
      .lte('date', endISO);

    if (salesError) throw salesError;

    const periodSales = salesData?.length || 0;
    const periodRevenue = salesData?.reduce((sum, sale) => sum + sale.value, 0) || 0;
    const conversionRate = periodLeads > 0 ? periodSales / periodLeads : 0;

    // Calculate today's leads
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todaysLeads, error: todayLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    if (todayLeadsError) throw todayLeadsError;

    // Calculate pending conversations
    const { count: pendingConversations, error: pendingError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .in('status', ['new', 'contacted']);

    if (pendingError) throw pendingError;

    // Get monthly stats for trends
    const monthlyStats = await getMonthlyStats();

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

export const getMonthlyStats = async (): Promise<MonthlyStats & { trends: { leads: TrendData; revenue: TrendData; sales: TrendData } }> => {
  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month leads
    const { count: currentLeads, error: currentLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString());

    if (currentLeadsError) throw currentLeadsError;

    // Previous month leads
    const { count: previousLeads, error: previousLeadsError } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString());

    if (previousLeadsError) throw previousLeadsError;

    // Current month sales
    const { data: currentSalesData, error: currentSalesError } = await supabase
      .from('sales')
      .select('value')
      .gte('date', currentMonthStart.toISOString())
      .lte('date', currentMonthEnd.toISOString());

    if (currentSalesError) throw currentSalesError;

    // Previous month sales
    const { data: previousSalesData, error: previousSalesError } = await supabase
      .from('sales')
      .select('value')
      .gte('date', previousMonthStart.toISOString())
      .lte('date', previousMonthEnd.toISOString());

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

export const getTimelineData = async (startDate: Date, endDate: Date): Promise<TimelineDataPoint[]> => {
  try {
    const data: TimelineDataPoint[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Get leads for this day
      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      if (leadsError) throw leadsError;

      // Get sales for this day
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('value')
        .gte('date', dayStart.toISOString())
        .lte('date', dayEnd.toISOString());

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

// Keep existing getDashboardStats and getCampaignPerformance functions
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
    // Fetch campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*');

    if (campaignsError) throw campaignsError;

    if (!campaigns) return [];

    // Create an array to store performance data
    const performanceData: CampaignPerformance[] = [];

    // For each campaign, calculate leads and sales
    for (const campaign of campaigns) {
      const campaignName = campaign.name;

      // Count leads for this campaign
      const { count: leadsCount, error: leadsError } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('campaign', campaignName);

      if (leadsError) throw leadsError;

      // Count sales and revenue for this campaign
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

// Track redirect to WhatsApp
export const trackRedirect = async (
  campaignId: string, 
  phone: string, 
  name?: string,
  eventType?: string
): Promise<{targetPhone?: string}> => {
  try {
    // Find the campaign by ID
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    // Create a default campaign if one with the specified ID doesn't exist
    if (campaignError || !campaign) {
      console.log(`Campaign with ID ${campaignId} not found. Using default campaign.`);
      
      // Create a new lead with a default campaign name if phone is provided
      if (phone) {
        const defaultCampaign = "Default Campaign";
        
        // Insert the new lead
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            name: name || 'Lead via Tracking',
            phone,
            campaign: defaultCampaign,
            status: 'new'
          });

        if (leadError) {
          console.error('Error creating lead:', leadError);
        } else {
          console.log('Created lead with default campaign');
        }
        
        // Return your WhatsApp number
        return { targetPhone: '5585998372658' };
      }
      
      // Return your WhatsApp number as default
      return { targetPhone: '5585998372658' };
    }

    // Event type handling based on campaign settings
    const type = eventType || campaign.event_type || 'lead';
    
    // Create a lead if the event type is 'lead' and the phone number doesn't exist yet
    if ((type === 'lead' || type === 'contact') && phone) {
      // Check if the lead with this phone already exists
      const { data: existingLead, error: checkError } = await supabase
        .from('leads')
        .select('id')
        .eq('phone', phone)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking for existing lead:', checkError);
      }
      
      // If no lead exists with this phone, create a new one
      if (!existingLead || existingLead.length === 0) {
        const { error: leadError } = await supabase
          .from('leads')
          .insert({
            name: name || 'Lead via Tracking',
            phone,
            campaign: campaign.name,
            campaign_id: campaign.id,
            status: 'new'
          });
        
        if (leadError) {
          console.error('Error creating lead:', leadError);
        }
      }
    }
    
    // Return the campaign's WhatsApp number for redirection
    return { targetPhone: campaign.whatsapp_number };
  } catch (error) {
    console.error('Error tracking redirect:', error);
    // Return a default phone number in case of error
    return { targetPhone: '5585998372658' };
  }
};
