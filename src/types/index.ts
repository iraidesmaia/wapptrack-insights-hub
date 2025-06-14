
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
  logoUrl?: string;
  redirectType?: 'whatsapp' | 'form';
  pixelIntegrationType?: 'direct' | 'form';
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

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface TrendData {
  value: number;
  trend: 'up' | 'down' | 'flat';
  percentage: number;
}

export interface MonthlyStats {
  currentMonth: {
    leads: number;
    revenue: number;
    sales: number;
  };
  previousMonth: {
    leads: number;
    revenue: number;
    sales: number;
  };
  trends: {
    leads: TrendData;
    revenue: TrendData;
    sales: TrendData;
  };
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
  monthlyLeadsTrend: TrendData;
  monthlyRevenueTrend: TrendData;
}

export interface CampaignPerformance {
  campaignId: string;
  campaignName: string;
  leads: number;
  sales: number;
  revenue: number;
  conversionRate: number;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  company_subtitle: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineDataPoint {
  date: string;
  leads: number;
  sales: number;
  revenue: number;
}
