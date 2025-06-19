import { Lead } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getLeads = async (clientId?: string): Promise<Lead[]> => {
  try {
    console.log('🔄 leadService.getLeads() - Iniciando busca...', { clientId });
    
    // Build query with optional client_id filter
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Add client_id filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: leads, error } = await query;

    if (error) throw error;
    
    console.log('📋 leadService.getLeads() - Dados brutos do Supabase:', leads);

    const mappedLeads = (leads || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      campaign: lead.campaign,
      status: lead.status,
      created_at: lead.created_at,
      custom_fields: lead.custom_fields || {},
      notes: lead.notes || '',
      first_contact_date: lead.first_contact_date,
      last_contact_date: lead.last_contact_date,
      last_message: lead.last_message,
      evolution_message_id: lead.evolution_message_id,
      evolution_status: lead.evolution_status,
      whatsapp_delivery_attempts: lead.whatsapp_delivery_attempts || 0,
      last_whatsapp_attempt: lead.last_whatsapp_attempt,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
      location: lead.location,
      ip_address: lead.ip_address,
      browser: lead.browser,
      os: lead.os,
      device_type: lead.device_type,
      device_model: lead.device_model,
      tracking_method: lead.tracking_method,
      ad_account: lead.ad_account,
      ad_set_name: lead.ad_set_name,
      ad_name: lead.ad_name,
      initial_message: lead.initial_message,
      country: lead.country,
      city: lead.city,
      screen_resolution: lead.screen_resolution,
      timezone: lead.timezone,
      language: lead.language,
      facebook_ad_id: lead.facebook_ad_id,
      facebook_adset_id: lead.facebook_adset_id,
      facebook_campaign_id: lead.facebook_campaign_id,
      client_id: lead.client_id || undefined
    }));
    
    console.log('✅ leadService.getLeads() - Leads mapeados com filtro por projeto:', {
      clientId,
      totalLeads: mappedLeads.length,
      leadsWithProject: mappedLeads.filter(l => l.client_id).length
    });
    
    return mappedLeads;
  } catch (error) {
    console.error("Error fetching leads:", error);
    return [];
  }
};

export const addLead = async (lead: Omit<Lead, 'id'>, clientId?: string): Promise<Lead> => {
  try {
    console.log('🔄 addLead - Iniciando criação de lead:', lead.name, { clientId });
    
    // Preparar dados do lead com client_id
    const leadData = {
      name: lead.name,
      phone: lead.phone,
      campaign: lead.campaign,
      status: lead.status,
      custom_fields: lead.custom_fields,
      notes: lead.notes,
      first_contact_date: lead.first_contact_date,
      last_contact_date: lead.last_contact_date,
      last_message: lead.last_message,
      evolution_message_id: lead.evolution_message_id,
      evolution_status: lead.evolution_status,
      whatsapp_delivery_attempts: lead.whatsapp_delivery_attempts,
      last_whatsapp_attempt: lead.last_whatsapp_attempt,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_content: lead.utm_content,
      utm_term: lead.utm_term,
      location: lead.location,
      ip_address: lead.ip_address,
      browser: lead.browser,
      os: lead.os,
      device_type: lead.device_type,
      device_model: lead.device_model,
      tracking_method: lead.tracking_method,
      ad_account: lead.ad_account,
      ad_set_name: lead.ad_set_name,
      ad_name: lead.ad_name,
      initial_message: lead.initial_message,
      country: lead.country,
      city: lead.city,
      screen_resolution: lead.screen_resolution,
      timezone: lead.timezone,
      language: lead.language,
      facebook_ad_id: lead.facebook_ad_id,
      facebook_adset_id: lead.facebook_adset_id,
      facebook_campaign_id: lead.facebook_campaign_id,
      // 🎯 ADICIONAR client_id para associar ao projeto
      client_id: clientId || lead.client_id || null
    };

    console.log('💾 Dados que serão inseridos no lead (com projeto):', {
      lead_name: leadData.name,
      phone: leadData.phone,
      client_id: leadData.client_id
    });

    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Lead criado com sucesso com projeto associado:', {
      id: data.id,
      lead_name: data.name,
      client_id: data.client_id
    });

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status,
      created_at: data.created_at,
      custom_fields: data.custom_fields || {},
      notes: data.notes || '',
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message,
      evolution_message_id: data.evolution_message_id,
      evolution_status: data.evolution_status,
      whatsapp_delivery_attempts: data.whatsapp_delivery_attempts || 0,
      last_whatsapp_attempt: data.last_whatsapp_attempt,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      location: data.location,
      ip_address: data.ip_address,
      browser: data.browser,
      os: data.os,
      device_type: data.device_type,
      device_model: data.device_model,
      tracking_method: data.tracking_method,
      ad_account: data.ad_account,
      ad_set_name: data.ad_set_name,
      ad_name: data.ad_name,
      initial_message: data.initial_message,
      country: data.country,
      city: data.city,
      screen_resolution: data.screen_resolution,
      timezone: data.timezone,
      language: data.language,
      facebook_ad_id: data.facebook_ad_id,
      facebook_adset_id: data.facebook_adset_id,
      facebook_campaign_id: data.facebook_campaign_id,
      client_id: data.client_id || undefined
    };
  } catch (error) {
    console.error("Error adding lead:", error);
    throw error;
  }
};

export const updateLead = async (id: string, lead: Partial<Lead>): Promise<Lead> => {
  try {
    const updateData: any = {};
    if (lead.name !== undefined) updateData.name = lead.name;
    if (lead.phone !== undefined) updateData.phone = lead.phone;
    if (lead.campaign !== undefined) updateData.campaign = lead.campaign;
    if (lead.status !== undefined) updateData.status = lead.status;
    if (lead.custom_fields !== undefined) updateData.custom_fields = lead.custom_fields;
    if (lead.notes !== undefined) updateData.notes = lead.notes;
    if (lead.first_contact_date !== undefined) updateData.first_contact_date = lead.first_contact_date;
    if (lead.last_contact_date !== undefined) updateData.last_contact_date = lead.last_contact_date;
    if (lead.last_message !== undefined) updateData.last_message = lead.last_message;
    if (lead.evolution_message_id !== undefined) updateData.evolution_message_id = lead.evolution_message_id;
    if (lead.evolution_status !== undefined) updateData.evolution_status = lead.evolution_status;
    if (lead.whatsapp_delivery_attempts !== undefined) updateData.whatsapp_delivery_attempts = lead.whatsapp_delivery_attempts;
    if (lead.last_whatsapp_attempt !== undefined) updateData.last_whatsapp_attempt = lead.last_whatsapp_attempt;
    if (lead.utm_source !== undefined) updateData.utm_source = lead.utm_source;
    if (lead.utm_medium !== undefined) updateData.utm_medium = lead.utm_medium;
    if (lead.utm_campaign !== undefined) updateData.utm_campaign = lead.utm_campaign;
    if (lead.utm_content !== undefined) updateData.utm_content = lead.utm_content;
    if (lead.utm_term !== undefined) updateData.utm_term = lead.utm_term;
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
    if (lead.country !== undefined) updateData.country = lead.country;
    if (lead.city !== undefined) updateData.city = lead.city;
    if (lead.screen_resolution !== undefined) updateData.screen_resolution = lead.screen_resolution;
    if (lead.timezone !== undefined) updateData.timezone = lead.timezone;
    if (lead.language !== undefined) updateData.language = lead.language;
    if (lead.facebook_ad_id !== undefined) updateData.facebook_ad_id = lead.facebook_ad_id;
    if (lead.facebook_adset_id !== undefined) updateData.facebook_adset_id = lead.facebook_adset_id;
    if (lead.facebook_campaign_id !== undefined) updateData.facebook_campaign_id = lead.facebook_campaign_id;

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      status: data.status,
      created_at: data.created_at,
      custom_fields: data.custom_fields || {},
      notes: data.notes || '',
      first_contact_date: data.first_contact_date,
      last_contact_date: data.last_contact_date,
      last_message: data.last_message,
      evolution_message_id: data.evolution_message_id,
      evolution_status: data.evolution_status,
      whatsapp_delivery_attempts: data.whatsapp_delivery_attempts || 0,
      last_whatsapp_attempt: data.last_whatsapp_attempt,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      location: data.location,
      ip_address: data.ip_address,
      browser: data.browser,
      os: data.os,
      device_type: data.device_type,
      device_model: data.device_model,
      tracking_method: data.tracking_method,
      ad_account: data.ad_account,
      ad_set_name: data.ad_set_name,
      ad_name: data.ad_name,
      initial_message: data.initial_message,
      country: data.country,
      city: data.city,
      screen_resolution: data.screen_resolution,
      timezone: data.timezone,
      language: data.language,
      facebook_ad_id: data.facebook_ad_id,
      facebook_adset_id: data.facebook_adset_id,
      facebook_campaign_id: data.facebook_campaign_id,
      client_id: data.client_id || undefined
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
