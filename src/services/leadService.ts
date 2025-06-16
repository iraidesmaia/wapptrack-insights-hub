
import { Lead } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getLeads = async (): Promise<Lead[]> => {
  try {
    console.log('🔄 leadService.getLeads() - Iniciando busca...');
    
    // Fetch leads from Supabase
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('📋 leadService.getLeads() - Dados brutos do Supabase:', leads);
    
    // Map database fields to our Lead interface - INCLUINDO novos campos
    const mappedLeads = (leads || []).map(lead => {
      console.log(`🔍 leadService.getLeads() - Mapeando lead ${lead.name}:`, {
        id: lead.id,
        last_message: lead.last_message,
        device_type: lead.device_type,
        location: lead.location
      });
      
      // Cast lead to any to access new fields safely
      const leadData = lead as any;
      
      return {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        campaign: lead.campaign,
        status: lead.status as Lead['status'],
        created_at: lead.created_at,
        custom_fields: lead.custom_fields as Record<string, string>,
        notes: lead.notes,
        first_contact_date: lead.first_contact_date,
        last_contact_date: lead.last_contact_date,
        last_message: lead.last_message || null,
        utm_source: lead.utm_source || '',
        utm_medium: lead.utm_medium || '',
        utm_campaign: lead.utm_campaign || '',
        utm_content: lead.utm_content || '',
        utm_term: lead.utm_term || '',
        // Novos campos com fallback seguro
        location: leadData.location || '',
        ip_address: leadData.ip_address || '',
        browser: leadData.browser || '',
        os: leadData.os || '',
        device_type: leadData.device_type || '',
        device_model: leadData.device_model || '',
        tracking_method: leadData.tracking_method || 'direct',
        ad_account: leadData.ad_account || '',
        ad_set_name: leadData.ad_set_name || '',
        ad_name: leadData.ad_name || '',
        initial_message: leadData.initial_message || '',
        // Campos adicionais de dispositivo
        country: leadData.country || '',
        city: leadData.city || '',
        screen_resolution: leadData.screen_resolution || '',
        timezone: leadData.timezone || '',
        language: leadData.language || ''
      };
    });
    
    console.log('✅ leadService.getLeads() - Leads mapeados com dados de dispositivo:', mappedLeads.map(lead => ({
      name: lead.name,
      device_type: lead.device_type,
      location: lead.location
    })));
    
    return mappedLeads;
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
        last_contact_date: lead.last_contact_date || null,
        last_message: lead.last_message || null,
        utm_source: lead.utm_source || '',
        utm_medium: lead.utm_medium || '',
        utm_campaign: lead.utm_campaign || '',
        utm_content: lead.utm_content || '',
        utm_term: lead.utm_term || '',
        // Novos campos
        location: lead.location || '',
        ip_address: lead.ip_address || '',
        browser: lead.browser || '',
        os: lead.os || '',
        device_type: lead.device_type || '',
        device_model: lead.device_model || '',
        tracking_method: lead.tracking_method || 'direct',
        ad_account: lead.ad_account || '',
        ad_set_name: lead.ad_set_name || '',
        ad_name: lead.ad_name || '',
        initial_message: lead.initial_message || ''
      })
      .select()
      .single();

    if (error) throw error;

    // Cast data to any to access new fields safely
    const leadData = data as any;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as Lead['status'],
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message || null,
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      utm_term: data.utm_term || '',
      // Novos campos com fallback seguro
      location: leadData.location || '',
      ip_address: leadData.ip_address || '',
      browser: leadData.browser || '',
      os: leadData.os || '',
      device_type: leadData.device_type || '',
      device_model: leadData.device_model || '',
      tracking_method: leadData.tracking_method || 'direct',
      ad_account: leadData.ad_account || '',
      ad_set_name: leadData.ad_set_name || '',
      ad_name: leadData.ad_name || '',
      initial_message: leadData.initial_message || ''
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
    if (lead.notes !== undefined) updateData.notes = lead.notes;
    if (lead.first_contact_date !== undefined) updateData.first_contact_date = lead.first_contact_date;
    if (lead.last_contact_date !== undefined) updateData.last_contact_date = lead.last_contact_date;
    if (lead.last_message !== undefined) updateData.last_message = lead.last_message;
    if (lead.utm_source !== undefined) updateData.utm_source = lead.utm_source;
    if (lead.utm_medium !== undefined) updateData.utm_medium = lead.utm_medium;
    if (lead.utm_campaign !== undefined) updateData.utm_campaign = lead.utm_campaign;
    if (lead.utm_content !== undefined) updateData.utm_content = lead.utm_content;
    if (lead.utm_term !== undefined) updateData.utm_term = lead.utm_term;
    // Novos campos
    if (lead.location !== undefined) updateData.location = lead.location;
    if (lead.ip_address !== undefined) updateData.ip_address = lead.ip_address;
    if (lead.browser !== undefined) updateData.browser = lead.browser;
    if (lead.os !== undefined) updateData.os = lead.os;
    if (lead.device_type !== undefined) updateData.device_type = lead.device_type;
    if (lead.device_model !== undefined) updateData.device_model = lead.device_model;
    if (lead.tracking_method !== undefined) updateData.tracking_method = lead.tracking_method;
    if (lead.ad_account !== undefined) updateData.ad_account = lead.ad_account;
    if (lead.ad_set_name !== undefined) updateData.ad_set_name = lead.ad_set_name;
    if (lead.ad_name !== undefined) updateData.ad_name = lead.ad_name;
    if (lead.initial_message !== undefined) updateData.initial_message = lead.initial_message;

    // Update lead in Supabase
    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Cast data to any to access new fields safely
    const leadData = data as any;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status as Lead['status'],
      created_at: data.created_at,
      custom_fields: data.custom_fields as Record<string, string>,
      notes: data.notes,
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message || null,
      utm_source: data.utm_source || '',
      utm_medium: data.utm_medium || '',
      utm_campaign: data.utm_campaign || '',
      utm_content: data.utm_content || '',
      utm_term: lead.utm_term || '',
      // Novos campos com fallback seguro
      location: leadData.location || '',
      ip_address: leadData.ip_address || '',
      browser: leadData.browser || '',
      os: leadData.os || '',
      device_type: leadData.device_type || '',
      device_model: leadData.device_model || '',
      tracking_method: leadData.tracking_method || 'direct',
      ad_account: leadData.ad_account || '',
      ad_set_name: leadData.ad_set_name || '',
      ad_name: leadData.ad_name || '',
      initial_message: leadData.initial_message || ''
    };
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
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
