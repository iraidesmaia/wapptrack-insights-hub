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
    
    // Map database fields to our Lead interface - INCLUINDO last_message E UTMs
    const mappedLeads = (leads || []).map(lead => {
      console.log(`🔍 leadService.getLeads() - Mapeando lead ${lead.name}:`, {
        id: lead.id,
        last_message: lead.last_message,
        last_message_type: typeof lead.last_message,
        last_message_raw: JSON.stringify(lead.last_message)
      });
      
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
        utm_term: lead.utm_term || ''
      };
    });
    
    console.log('✅ leadService.getLeads() - Leads mapeados:', mappedLeads.map(lead => ({
      name: lead.name,
      last_message: lead.last_message,
      type: typeof lead.last_message
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
        utm_term: lead.utm_term || ''
      })
      .select()
      .single();

    if (error) throw error;

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
      utm_term: data.utm_term || ''
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
    if (lead.last_message !== undefined) updateData.last_message = lead.last_message;
    if (lead.utm_source !== undefined) updateData.utm_source = lead.utm_source;
    if (lead.utm_medium !== undefined) updateData.utm_medium = lead.utm_medium;
    if (lead.utm_campaign !== undefined) updateData.utm_campaign = lead.utm_campaign;
    if (lead.utm_content !== undefined) updateData.utm_content = lead.utm_content;
    if (lead.utm_term !== undefined) updateData.utm_term = lead.utm_term;

    // Update lead in Supabase
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
      utm_term: data.utm_term || ''
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
