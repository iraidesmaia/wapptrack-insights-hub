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
  email: string;
  phone: string;
  source: string;
  campaign: string;
  status: string;
  notes?: string;
}

export interface Campaign {
  id: string;
  created_at: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  budget: number;
  objective: string;
  target_audience: string;
  content: string;
  results: string;
}

export interface Sale {
  id: string;
  created_at: string;
  lead_id: string;
  product: string;
  amount: number;
  sale_date: string;
  status: string;
  notes?: string;
}

export interface CompanySettings {
  id?: string;
  company_name: string;
  company_subtitle: string;
  logo_url: string;
  theme?: 'light' | 'dark' | 'system';
  created_at?: string;
  updated_at?: string;
}
