
export interface Campaign {
  id: string;
  name: string;
  pixel_id?: string;
  facebook_access_token?: string;
  whatsapp_number?: string;
  event_type?: string;
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
  redirect_type?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  active?: boolean;
  created_at?: string;
  pixel_integration_type?: string;
  conversion_keywords?: string[];
  cancellation_keywords?: string[];
}

export interface CompanyBranding {
  logo: string;
  title: string;
  subtitle: string;
}
