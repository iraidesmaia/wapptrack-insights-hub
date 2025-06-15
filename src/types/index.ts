export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
}

export interface Lead {
  id: string;
  created_at: string;
  name: string;
  email?: string;
  phone: string;
  source?: string;
  campaign: string;
  campaign_id?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' | 'lead' | 'to_recover';
  notes?: string;
  first_contact_date?: string;
  last_contact_date?: string;
  custom_fields?: any;
  whatsapp_delivery_attempts?: number;
  last_whatsapp_attempt?: string;
  last_message?: string;
  lead_score?: number;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
}

export interface Campaign {
  id: string;
  name: string;
  pixel_id?: string;
  facebook_access_token?: string;
  whatsapp_number?: string;
  event_type?: 'contact' | 'lead' | 'page_view' | 'sale';
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
  redirect_type?: 'whatsapp' | 'form';
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  active?: boolean;
  created_at?: string;
  pixel_integration_type?: 'direct' | 'form';
  conversion_keywords?: string[];
  cancellation_keywords?: string[];
  conversion_api_enabled?: boolean;
  test_event_code?: string;
  advanced_matching_enabled?: boolean;
  custom_audience_pixel_id?: string;
  server_side_api_enabled?: boolean;
  tracking_domain?: string;
  external_id?: string;
  data_processing_options?: string[];
  data_processing_options_country?: number;
  data_processing_options_state?: number;
}

export interface Sale {
  id: string;
  created_at?: string;
  lead_id?: string;
  lead_name: string;
  product?: string;
  amount?: number;
  value: number;
  sale_date?: string;
  date?: string;
  status?: string;
  notes?: string;
  campaign: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface CompanySettings {
  id?: string;
  company_name: string;
  company_subtitle: string;
  logo_url?: string;
  theme?: Theme;
  created_at?: string;
  updated_at?: string;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TrendData {
  trend: 'up' | 'down' | 'flat';
  percentage: number;
}

export interface DashboardStats {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  totalRevenue: number;
  todaysLeads: number;
  confirmedSales: number;
  pendingConversations: number;
  monthlyLeads: number;
  monthlyRevenue: number;
  monthlyLeadsTrend?: TrendData;
  monthlyRevenueTrend?: TrendData;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export interface TimelineDataPoint {
  date: string;
  leads: number;
  sales: number;
  revenue: number;
}

export interface MonthlyStats {
  currentMonth: {
    leads: number;
    revenue: number;
  };
  previousMonth: {
    leads: number;
    revenue: number;
  };
}
