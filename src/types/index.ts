
export interface Lead {
  id: string;
  name: string;
  phone: string;
  campaign: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  createdAt: string;
  customFields?: Record<string, string>;
  notes?: string;
  firstContactDate?: string;
  lastContactDate?: string;
}

export interface Campaign {
  id: string;
  name: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  pixelId?: string;
  createdAt: string;
  active: boolean;
  whatsappNumber?: string;
  eventType?: 'contact' | 'lead' | 'page_view' | 'sale';
  customMessage?: string;
  companyTitle?: string;
  companySubtitle?: string;
}

export interface Sale {
  id: string;
  value: number;
  date: string;
  leadId: string;
  leadName: string;
  campaign: string;
  product?: string;
  notes?: string;
}

export interface DashboardStats {
  totalLeads: number;
  totalSales: number;
  conversionRate: number;
  totalRevenue: number;
  todaysLeads: number;
  confirmedSales: number;
  pendingConversations: number;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}
