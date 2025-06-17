import { Lead } from "../types";
import { supabase } from "../integrations/supabase/client";
import { getDeviceDataByPhone } from "./deviceDataService";
import { createPhoneSearchVariations } from "@/lib/phoneCorrection";

export const getLeads = async (clientId?: string): Promise<Lead[]> => {
  try {
    console.log('🔄 leadService.getLeads() - Iniciando busca...', { clientId });
    
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrar por cliente se fornecido
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: leads, error } = await query;

    if (error) throw error;
    
    console.log('📋 leadService.getLeads() - Dados brutos do Supabase:', leads);
    
    // Map database fields to our Lead interface
    const mappedLeads = (leads || []).map(lead => {
      console.log(`🔍 leadService.getLeads() - Mapeando lead ${lead.name}:`, {
        id: lead.id,
        last_message: lead.last_message,
        device_type: lead.device_type,
        location: lead.location
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
        utm_term: lead.utm_term || '',
        // Novos campos com fallback seguro
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
        initial_message: lead.initial_message || '',
        // Campos adicionais de dispositivo
        country: lead.country || '',
        city: lead.city || '',
        screen_resolution: lead.screen_resolution || '',
        timezone: lead.timezone || '',
        language: lead.language || ''
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

export const findLeadByPhoneVariations = async (phone: string, clientId?: string): Promise<Lead | null> => {
  try {
    console.log('🔍 Buscando lead existente para telefone:', phone, { clientId });
    
    const phoneVariations = createPhoneSearchVariations(phone);
    console.log('📞 Variações de telefone para busca:', phoneVariations);
    
    let query = supabase
      .from('leads')
      .select('*')
      .in('phone', phoneVariations)
      .limit(1);

    // Filtrar por cliente se fornecido
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: existingLead, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar lead existente:', error);
      return null;
    }

    if (existingLead && existingLead.length > 0) {
      const lead = existingLead[0];
      console.log('✅ Lead existente encontrado:', {
        id: lead.id,
        name: lead.name,
        phone: lead.phone,
        created_at: lead.created_at
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
        utm_term: lead.utm_term || '',
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
        initial_message: lead.initial_message || '',
        country: lead.country || '',
        city: lead.city || '',
        screen_resolution: lead.screen_resolution || '',
        timezone: lead.timezone || '',
        language: lead.language || ''
      };
    }

    console.log('❌ Nenhum lead existente encontrado para as variações:', phoneVariations);
    return null;
  } catch (error) {
    console.error('❌ Erro ao buscar lead por variações de telefone:', error);
    return null;
  }
};

export const addLead = async (lead: Omit<Lead, 'id' | 'created_at'>, clientId?: string): Promise<Lead> => {
  try {
    console.log('🔄 addLead - Iniciando criação de lead:', lead.name, lead.phone, { clientId });
    
    // Verificar se já existe lead com este telefone no cliente específico
    const existingLead = await findLeadByPhoneVariations(lead.phone, clientId);
    
    if (existingLead) {
      console.log('🔒 Lead já existe, preservando nome original e atualizando apenas dados necessários:', {
        leadId: existingLead.id,
        nomeOriginal: existingLead.name,
        nomeNovo: lead.name,
        nomePreservado: existingLead.name
      });
      
      const { data, error } = await supabase
        .from('leads')
        .update({
          last_contact_date: new Date().toISOString()
        })
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar lead existente:', error);
        throw error;
      }

      return existingLead;
    }
    
    // Buscar dados do dispositivo salvos para este telefone
    let deviceData = null;
    if (lead.phone) {
      console.log('📱 Buscando dados do dispositivo para telefone:', lead.phone);
      deviceData = await getDeviceDataByPhone(lead.phone);
      
      if (deviceData) {
        console.log('✅ Dados do dispositivo encontrados:', {
          device_type: deviceData.device_type,
          browser: deviceData.browser,
          location: deviceData.location,
          ip_address: deviceData.ip_address
        });
      } else {
        console.log('❌ Nenhum dado do dispositivo encontrado para:', lead.phone);
      }
    }

    // Preparar dados do lead com informações do dispositivo se disponíveis
    // user_id será automaticamente definido pelo default auth.uid()
    const leadData = {
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
      // Incluir dados do dispositivo se disponíveis
      location: deviceData?.location || lead.location || '',
      ip_address: deviceData?.ip_address || lead.ip_address || '',
      browser: deviceData?.browser || lead.browser || '',
      os: deviceData?.os || lead.os || '',
      device_type: deviceData?.device_type || lead.device_type || '',
      device_model: deviceData?.device_model || lead.device_model || '',
      tracking_method: lead.tracking_method || 'direct',
      ad_account: lead.ad_account || '',
      ad_set_name: lead.ad_set_name || '',
      ad_name: lead.ad_name || '',
      initial_message: lead.initial_message || '',
      // Campos adicionais de dispositivo
      country: deviceData?.country || lead.country || '',
      city: deviceData?.city || lead.city || '',
      screen_resolution: deviceData?.screen_resolution || lead.screen_resolution || '',
      timezone: deviceData?.timezone || lead.timezone || '',
      language: deviceData?.language || lead.language || '',
      // Incluir client_id se fornecido
      client_id: clientId
    };

    console.log('💾 Dados que serão inseridos no lead (com dados do dispositivo):', {
      nome: leadData.name,
      telefone: leadData.phone,
      client_id: leadData.client_id,
      device_type: leadData.device_type,
      browser: leadData.browser,
      location: leadData.location,
      ip_address: leadData.ip_address,
      tem_dados_dispositivo: !!deviceData
    });

    // Insert lead into Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Lead criado com sucesso com dados do dispositivo:', {
      id: data.id,
      name: data.name,
      device_type: data.device_type,
      location: data.location
    });

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
      location: data.location || '',
      ip_address: data.ip_address || '',
      browser: data.browser || '',
      os: data.os || '',
      device_type: data.device_type || '',
      device_model: data.device_model || '',
      tracking_method: data.tracking_method || 'direct',
      ad_account: data.ad_account || '',
      ad_set_name: data.ad_set_name || '',
      ad_name: data.ad_name || '',
      initial_message: data.initial_message || '',
      // Campos adicionais de dispositivo
      country: data.country || '',
      city: data.city || '',
      screen_resolution: data.screen_resolution || '',
      timezone: data.timezone || '',
      language: data.language || ''
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
    // Campos adicionais de dispositivo
    if (lead.country !== undefined) updateData.country = lead.country;
    if (lead.city !== undefined) updateData.city = lead.city;
    if (lead.screen_resolution !== undefined) updateData.screen_resolution = lead.screen_resolution;
    if (lead.timezone !== undefined) updateData.timezone = lead.timezone;
    if (lead.language !== undefined) updateData.language = lead.language;

    // RLS garantirá que apenas leads do usuário logado sejam atualizados
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
      utm_term: lead.utm_term || '',
      // Novos campos com fallback seguro
      location: data.location || '',
      ip_address: data.ip_address || '',
      browser: data.browser || '',
      os: data.os || '',
      device_type: data.device_type || '',
      device_model: data.device_model || '',
      tracking_method: data.tracking_method || 'direct',
      ad_account: data.ad_account || '',
      ad_set_name: data.ad_set_name || '',
      ad_name: data.ad_name || '',
      initial_message: data.initial_message || '',
      // Campos adicionais de dispositivo
      country: data.country || '',
      city: data.city || '',
      screen_resolution: data.screen_resolution || '',
      timezone: data.timezone || '',
      language: data.language || ''
    };
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  try {
    // RLS garantirá que apenas leads do usuário logado sejam deletados
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
