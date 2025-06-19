import { Campaign } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getCampaigns = async (projectId: string): Promise<Campaign[]> => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (campaigns || []).map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      user_id: campaign.user_id,
      created_at: campaign.created_at,
      active: campaign.active,
      whatsapp_number: campaign.whatsapp_number,
      utm_source: campaign.utm_source,
      utm_medium: campaign.utm_medium,
      utm_campaign: campaign.utm_campaign,
      utm_content: campaign.utm_content,
      utm_term: campaign.utm_term,
      pixel_id: campaign.pixel_id,
      event_type: campaign.event_type,
      custom_message: campaign.custom_message,
      company_title: campaign.company_title,
      company_subtitle: campaign.company_subtitle,
      logo_url: campaign.logo_url,
      redirect_type: campaign.redirect_type,
      pixel_integration_type: campaign.pixel_integration_type,
      auto_create_leads: campaign.auto_create_leads,
      conversion_api_enabled: campaign.conversion_api_enabled,
      advanced_matching_enabled: campaign.advanced_matching_enabled,
      server_side_api_enabled: campaign.server_side_api_enabled,
      data_processing_options: campaign.data_processing_options,
      data_processing_options_country: campaign.data_processing_options_country,
      data_processing_options_state: campaign.data_processing_options_state,
      evolution_api_key: campaign.evolution_api_key,
      evolution_instance_name: campaign.evolution_instance_name,
      evolution_base_url: campaign.evolution_base_url,
      webhook_callback_url: campaign.webhook_callback_url,
      conversion_keywords: campaign.conversion_keywords,
      cancellation_keywords: campaign.cancellation_keywords,
      facebook_access_token: campaign.facebook_access_token,
      test_event_code: campaign.test_event_code,
      custom_audience_pixel_id: campaign.custom_audience_pixel_id,
      tracking_domain: campaign.tracking_domain,
      external_id: campaign.external_id
    }));
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return [];
  }
};

export const addCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at'> & { project_id: string }): Promise<Campaign> => {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: campaign.name,
        project_id: campaign.project_id,
        active: campaign.active ?? true,
        whatsapp_number: campaign.whatsapp_number,
        utm_source: campaign.utm_source,
        utm_medium: campaign.utm_medium,
        utm_campaign: campaign.utm_campaign,
        utm_content: campaign.utm_content,
        utm_term: campaign.utm_term,
        pixel_id: campaign.pixel_id,
        event_type: campaign.event_type,
        custom_message: campaign.custom_message,
        company_title: campaign.company_title,
        company_subtitle: campaign.company_subtitle,
        logo_url: campaign.logo_url,
        redirect_type: campaign.redirect_type,
        pixel_integration_type: campaign.pixel_integration_type,
        auto_create_leads: campaign.auto_create_leads,
        conversion_api_enabled: campaign.conversion_api_enabled,
        advanced_matching_enabled: campaign.advanced_matching_enabled,
        server_side_api_enabled: campaign.server_side_api_enabled,
        data_processing_options: campaign.data_processing_options,
        data_processing_options_country: campaign.data_processing_options_country,
        data_processing_options_state: campaign.data_processing_options_state,
        evolution_api_key: campaign.evolution_api_key,
        evolution_instance_name: campaign.evolution_instance_name,
        evolution_base_url: campaign.evolution_base_url,
        webhook_callback_url: campaign.webhook_callback_url,
        conversion_keywords: campaign.conversion_keywords,
        cancellation_keywords: campaign.cancellation_keywords,
        facebook_access_token: campaign.facebook_access_token,
        test_event_code: campaign.test_event_code,
        custom_audience_pixel_id: campaign.custom_audience_pixel_id,
        tracking_domain: campaign.tracking_domain,
        external_id: campaign.external_id
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      user_id: data.user_id,
      created_at: data.created_at,
      active: data.active,
      whatsapp_number: data.whatsapp_number,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      pixel_id: data.pixel_id,
      event_type: data.event_type,
      custom_message: campaign.custom_message,
      company_title: campaign.company_title,
      company_subtitle: campaign.company_subtitle,
      logo_url: campaign.logo_url,
      redirect_type: campaign.redirect_type,
      pixel_integration_type: campaign.pixel_integration_type,
      auto_create_leads: campaign.auto_create_leads,
      conversion_api_enabled: campaign.conversion_api_enabled,
      advanced_matching_enabled: campaign.advanced_matching_enabled,
      server_side_api_enabled: campaign.server_side_api_enabled,
      data_processing_options: campaign.data_processing_options,
      data_processing_options_country: campaign.data_processing_options_country,
      data_processing_options_state: campaign.data_processing_options_state,
      evolution_api_key: campaign.evolution_api_key,
      evolution_instance_name: campaign.evolution_instance_name,
      evolution_base_url: campaign.evolution_base_url,
      webhook_callback_url: campaign.webhook_callback_url,
      conversion_keywords: campaign.conversion_keywords,
      cancellation_keywords: campaign.cancellation_keywords,
      facebook_access_token: campaign.facebook_access_token,
      test_event_code: campaign.test_event_code,
      custom_audience_pixel_id: campaign.custom_audience_pixel_id,
      tracking_domain: campaign.tracking_domain,
      external_id: campaign.external_id
    };
  } catch (error) {
    console.error("Error adding campaign:", error);
    throw error;
  }
};

export const updateCampaign = async (id: string, campaign: Partial<Campaign>): Promise<Campaign> => {
  try {
    const updateData: any = {};
    if (campaign.name) updateData.name = campaign.name;
    if (campaign.active !== undefined) updateData.active = campaign.active;
    if (campaign.whatsapp_number !== undefined) updateData.whatsapp_number = campaign.whatsapp_number;
    if (campaign.utm_source !== undefined) updateData.utm_source = campaign.utm_source;
    if (campaign.utm_medium !== undefined) updateData.utm_medium = campaign.utm_medium;
    if (campaign.utm_campaign !== undefined) updateData.utm_campaign = campaign.utm_campaign;
    if (campaign.utm_content !== undefined) updateData.utm_content = campaign.utm_content;
    if (campaign.utm_term !== undefined) updateData.utm_term = campaign.utm_term;
    if (campaign.pixel_id !== undefined) updateData.pixel_id = campaign.pixel_id;
    if (campaign.event_type !== undefined) updateData.event_type = campaign.event_type;
    if (campaign.custom_message !== undefined) updateData.custom_message = campaign.custom_message;
    if (campaign.company_title !== undefined) updateData.company_title = campaign.company_title;
    if (campaign.company_subtitle !== undefined) updateData.company_subtitle = campaign.company_subtitle;
    if (campaign.logo_url !== undefined) updateData.logo_url = campaign.logo_url;
    if (campaign.redirect_type !== undefined) updateData.redirect_type = campaign.redirect_type;
    if (campaign.pixel_integration_type !== undefined) updateData.pixel_integration_type = campaign.pixel_integration_type;
    if (campaign.auto_create_leads !== undefined) updateData.auto_create_leads = campaign.auto_create_leads;
    if (campaign.conversion_api_enabled !== undefined) updateData.conversion_api_enabled = campaign.conversion_api_enabled;
    if (campaign.advanced_matching_enabled !== undefined) updateData.advanced_matching_enabled = campaign.advanced_matching_enabled;
    if (campaign.server_side_api_enabled !== undefined) updateData.server_side_api_enabled = campaign.server_side_api_enabled;
    if (campaign.data_processing_options !== undefined) updateData.data_processing_options = campaign.data_processing_options;
    if (campaign.data_processing_options_country !== undefined) updateData.data_processing_options_country = campaign.data_processing_options_country;
    if (campaign.data_processing_options_state !== undefined) updateData.data_processing_options_state = campaign.data_processing_options_state;
    if (campaign.evolution_api_key !== undefined) updateData.evolution_api_key = campaign.evolution_api_key;
    if (campaign.evolution_instance_name !== undefined) updateData.evolution_instance_name = campaign.evolution_instance_name;
    if (campaign.evolution_base_url !== undefined) updateData.evolution_base_url = campaign.evolution_base_url;
    if (campaign.webhook_callback_url !== undefined) updateData.webhook_callback_url = campaign.webhook_callback_url;
    if (campaign.conversion_keywords !== undefined) updateData.conversion_keywords = campaign.conversion_keywords;
    if (campaign.cancellation_keywords !== undefined) updateData.cancellation_keywords = campaign.cancellation_keywords;
    if (campaign.facebook_access_token !== undefined) updateData.facebook_access_token = campaign.facebook_access_token;
    if (campaign.test_event_code !== undefined) updateData.test_event_code = campaign.test_event_code;
    if (campaign.custom_audience_pixel_id !== undefined) updateData.custom_audience_pixel_id = campaign.custom_audience_pixel_id;
    if (campaign.tracking_domain !== undefined) updateData.tracking_domain = campaign.tracking_domain;
    if (campaign.external_id !== undefined) updateData.external_id = campaign.external_id;

    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      user_id: data.user_id,
      created_at: data.created_at,
      active: data.active,
      whatsapp_number: data.whatsapp_number,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_content: data.utm_content,
      utm_term: data.utm_term,
      pixel_id: data.pixel_id,
      event_type: data.event_type,
      custom_message: campaign.custom_message,
      company_title: campaign.company_title,
      company_subtitle: campaign.company_subtitle,  
      logo_url: campaign.logo_url,
      redirect_type: campaign.redirect_type,
      pixel_integration_type: campaign.pixel_integration_type,
      auto_create_leads: campaign.auto_create_leads,
      conversion_api_enabled: campaign.conversion_api_enabled,
      advanced_matching_enabled: campaign.advanced_matching_enabled,
      server_side_api_enabled: campaign.server_side_api_enabled,
      data_processing_options: campaign.data_processing_options,
      data_processing_options_country: campaign.data_processing_options_country,
      data_processing_options_state: campaign.data_processing_options_state,
      evolution_api_key: campaign.evolution_api_key,
      evolution_instance_name: campaign.evolution_instance_name,
      evolution_base_url: campaign.evolution_base_url,
      webhook_callback_url: campaign.webhook_callback_url,
      conversion_keywords: campaign.conversion_keywords,
      cancellation_keywords: campaign.cancellation_keywords,
      facebook_access_token: campaign.facebook_access_token,
      test_event_code: campaign.test_event_code,
      custom_audience_pixel_id: campaign.custom_audience_pixel_id,
      tracking_domain: campaign.tracking_domain,
      external_id: campaign.external_id
    };
  } catch (error) {
    console.error("Error updating campaign:", error);
    throw error;
  }
};

export const deleteCampaign = async (id: string): Promise<void> => {
  try {
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
