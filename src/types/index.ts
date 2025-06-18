
export interface Lead {
  id: string;
  name: string;
  phone: string;
  campaign: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'lead' | 'to_recover';
  created_at: string;
  custom_fields: Record<string, string>;
  notes?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  last_message?: string | null;
  campaign_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  location?: string;
  ip_address?: string;
  browser?: string;
  os?: string;
  device_type?: string;
  device_model?: string;
  tracking_method?: string;
  ad_account?: string;
  ad_set_name?: string;
  ad_name?: string;
  initial_message?: string;
  country?: string;
  city?: string;
  screen_resolution?: string;
  timezone?: string;
  language?: string;
  whatsapp_delivery_attempts?: number;
  last_whatsapp_attempt?: string;
  evolution_message_id?: string;
  evolution_status?: string;
}

export interface Campaign {
  id: string;
  name: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  pixel_id?: string;
  whatsapp_number?: string;
  event_type?: string;
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
  redirect_type?: string;
  active?: boolean;
  created_at?: string;
  user_id?: string;
  client_id?: string;
  pixel_integration_type?: string;
  conversion_api_enabled?: boolean;
  facebook_access_token?: string;
  test_event_code?: string;
  custom_audience_pixel_id?: string;
  tracking_domain?: string;
  external_id?: string;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
  advanced_matching_enabled?: boolean;
  server_side_api_enabled?: boolean;
  evolution_api_key?: string;
  evolution_instance_name?: string;
  evolution_base_url?: string;
  webhook_callback_url?: string;
  auto_create_leads?: boolean;
  conversion_keywords?: string[];
  cancellation_keywords?: string[];
}

export interface Sale {
  id: string;
  value: number;
  date: string;
  lead_id?: string;
  lead_name: string;
  campaign: string;
  product?: string;
  notes?: string;
}

export interface DashboardStats {
  totalLeads: number;
  monthlyLeads: number;
  monthlyLeadsTrend?: number;
  confirmedSales: number;
  monthlyRevenue: number;
  monthlyRevenueTrend?: number;
  pendingConversations: number;
  conversionRate: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TimelineDataPoint {
  date: string;
  leads: number;
  sales: number;
  revenue: number;
}
