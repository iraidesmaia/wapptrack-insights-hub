import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types';

export const getLeads = async (clientId?: string): Promise<Lead[]> => {
  try {
    console.log('🔄 leadService.getLeads() - Iniciando busca...', { clientId });
    
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // 🎯 Filtrar por client_id se fornecido
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ leadService.getLeads() - Erro na consulta:', error);
      throw error;
    }

    console.log('📋 leadService.getLeads() - Dados brutos do Supabase:', data);

    // Map Supabase data to Lead type with proper type casting
    const leads: Lead[] = (data || []).map(lead => ({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      campaign: lead.campaign,
      status: (lead.status as Lead['status']) || 'new',
      created_at: lead.created_at,
      custom_fields: (typeof lead.custom_fields === 'object' && lead.custom_fields !== null) 
        ? lead.custom_fields as Record<string, string>
        : {},
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
      client_id: lead.client_id,
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
      campaign_id: lead.campaign_id,
      user_id: lead.user_id
    }));

    console.log('✅ leadService.getLeads() - Leads mapeados com filtro por projeto:', {
      clientId,
      totalLeads: leads.length,
      leadsWithProject: leads.filter(l => l.client_id === clientId).length
    });

    return leads;
  } catch (error) {
    console.error('❌ leadService.getLeads() - Erro:', error);
    throw error;
  }
};

export const addLead = async (leadData: Omit<Lead, 'id'>, clientId?: string): Promise<Lead> => {
  try {
    console.log('💾 leadService.addLead() - Criando lead para projeto:', { clientId });
    
    const leadToInsert = {
      ...leadData,
      client_id: clientId, // 🎯 Associar ao projeto ativo
      status: leadData.status || 'new',
      custom_fields: leadData.custom_fields || {},
      whatsapp_delivery_attempts: leadData.whatsapp_delivery_attempts || 0
    };

    const { data, error } = await supabase
      .from('leads')
      .insert([leadToInsert])
      .select()
      .single();

    if (error) {
      console.error('❌ leadService.addLead() - Erro:', error);
      throw error;
    }

    console.log('✅ leadService.addLead() - Lead criado:', data);

    // Map the returned data to Lead type with proper casting
    const newLead: Lead = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      campaign_id: data.campaign_id,
      status: (data.status as Lead['status']) || 'new',
      created_at: data.created_at,
      custom_fields: (typeof data.custom_fields === 'object' && data.custom_fields !== null) 
        ? data.custom_fields as Record<string, string>
        : {},
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
      client_id: data.client_id,
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
      user_id: data.user_id
    };

    return newLead;
  } catch (error) {
    console.error('❌ leadService.addLead() - Erro:', error);
    throw error;
  }
};

export const updateLead = async (id: string, leadData: Partial<Lead>): Promise<Lead> => {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        ...leadData,
        status: leadData.status || 'new',
        custom_fields: leadData.custom_fields || {}
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ leadService.updateLead() - Erro:', error);
      throw error;
    }

    // Map the returned data to Lead type with proper casting
    const updatedLead: Lead = {
      id: data.id,
      name: data.name,
      phone: data.phone,
      campaign: data.campaign,
      campaign_id: data.campaign_id,
      status: (data.status as Lead['status']) || 'new',
      created_at: data.created_at,
      custom_fields: (typeof data.custom_fields === 'object' && data.custom_fields !== null) 
        ? data.custom_fields as Record<string, string>
        : {},
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
      client_id: data.client_id,
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
      user_id: data.user_id
    };

    return updatedLead;
  } catch (error) {
    console.error('❌ leadService.updateLead() - Erro:', error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ leadService.deleteLead() - Erro:', error);
      throw error;
    }

    console.log('✅ leadService.deleteLead() - Lead excluído:', id);
  } catch (error) {
    console.error('❌ leadService.deleteLead() - Erro:', error);
    throw error;
  }
};
