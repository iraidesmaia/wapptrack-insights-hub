
export interface Campaign {
  id: string;
  name: string;
  pixel_id?: string;
  whatsapp_number?: string;
  event_type?: string;
  custom_message?: string;
  company_title?: string;
  company_subtitle?: string;
  logo_url?: string;
  redirect_type?: string;
}

export interface CompanyBranding {
  logo: string;
  title: string;
  subtitle: string;
}
