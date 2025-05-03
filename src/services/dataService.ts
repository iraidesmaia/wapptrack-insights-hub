
import { Campaign, Lead, Sale, DashboardStats, CampaignPerformance } from "../types";
import { generateId } from "../lib/utils";

// Mock data storage (in memory database)
const leads: Lead[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '(11) 98765-4321',
    campaign: 'Instagram',
    status: 'qualified',
    createdAt: new Date().toISOString(),
    customFields: { interesse: 'Marketing Digital' },
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    phone: '(21) 99876-5432',
    campaign: 'Facebook',
    status: 'contacted',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    customFields: { interesse: 'Afiliados' },
  },
  {
    id: '3',
    name: 'Pedro Santos',
    phone: '(31) 97654-3210',
    campaign: 'Google',
    status: 'new',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '4',
    name: 'Ana Souza',
    phone: '(41) 96543-2109',
    campaign: 'Instagram',
    status: 'converted',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '5',
    name: 'Lucas Ferreira',
    phone: '(51) 95432-1098',
    campaign: 'Website',
    status: 'lost',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
];

const campaigns: Campaign[] = [
  {
    id: '1',
    name: 'Instagram - Stories',
    utmSource: 'instagram',
    utmMedium: 'social',
    utmCampaign: 'promo_junho',
    active: true,
    createdAt: new Date(Date.now() - 1000000000).toISOString(),
  },
  {
    id: '2',
    name: 'Facebook - Timeline',
    utmSource: 'facebook',
    utmMedium: 'social',
    utmCampaign: 'promo_junho',
    active: true,
    createdAt: new Date(Date.now() - 2000000000).toISOString(),
  },
  {
    id: '3',
    name: 'Google Ads',
    utmSource: 'google',
    utmMedium: 'cpc',
    utmCampaign: 'search_traffic',
    active: true,
    createdAt: new Date(Date.now() - 3000000000).toISOString(),
  },
  {
    id: '4',
    name: 'Website Orgânico',
    utmSource: 'website',
    utmMedium: 'organic',
    active: true,
    createdAt: new Date(Date.now() - 4000000000).toISOString(),
  },
];

const sales: Sale[] = [
  {
    id: '1',
    value: 1997,
    date: new Date().toISOString(),
    leadId: '4',
    leadName: 'Ana Souza',
    campaign: 'Instagram',
    product: 'Curso Básico',
  },
  {
    id: '2',
    value: 997,
    date: new Date(Date.now() - 86400000).toISOString(),
    leadId: '2',
    leadName: 'Maria Oliveira',
    campaign: 'Facebook',
    product: 'E-book',
  },
  {
    id: '3',
    value: 2997,
    date: new Date(Date.now() - 172800000).toISOString(),
    leadId: '1',
    leadName: 'João Silva',
    campaign: 'Instagram',
    product: 'Curso Avançado',
  },
];

// Lead methods
export const getLeads = async (): Promise<Lead[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...leads];
};

export const addLead = async (lead: Omit<Lead, 'id' | 'createdAt'>): Promise<Lead> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newLead: Lead = {
    ...lead,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  leads.unshift(newLead);
  return newLead;
};

export const updateLead = async (id: string, lead: Partial<Lead>): Promise<Lead> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) {
    throw new Error('Lead não encontrado');
  }
  
  const updatedLead = { 
    ...leads[index], 
    ...lead,
  };
  
  leads[index] = updatedLead;
  return updatedLead;
};

export const deleteLead = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) {
    throw new Error('Lead não encontrado');
  }
  
  leads.splice(index, 1);
};

// Campaign methods
export const getCampaigns = async (): Promise<Campaign[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...campaigns];
};

export const addCampaign = async (campaign: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newCampaign: Campaign = {
    ...campaign,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  campaigns.push(newCampaign);
  return newCampaign;
};

export const updateCampaign = async (id: string, campaign: Partial<Campaign>): Promise<Campaign> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error('Campanha não encontrada');
  }
  
  const updatedCampaign = { 
    ...campaigns[index], 
    ...campaign 
  };
  
  campaigns[index] = updatedCampaign;
  return updatedCampaign;
};

export const deleteCampaign = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = campaigns.findIndex(c => c.id === id);
  if (index === -1) {
    throw new Error('Campanha não encontrada');
  }
  
  // Check if campaign is used in leads
  const isUsed = leads.some(lead => lead.campaign === campaigns[index].name);
  if (isUsed) {
    throw new Error('Esta campanha não pode ser excluída pois está sendo usada por leads');
  }
  
  campaigns.splice(index, 1);
};

// Sale methods
export const getSales = async (): Promise<Sale[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...sales];
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newSale: Sale = {
    ...sale,
    id: generateId(),
  };
  
  sales.push(newSale);
  return newSale;
};

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = sales.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('Venda não encontrada');
  }
  
  const updatedSale = { 
    ...sales[index], 
    ...sale 
  };
  
  sales[index] = updatedSale;
  return updatedSale;
};

export const deleteSale = async (id: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = sales.findIndex(s => s.id === id);
  if (index === -1) {
    throw new Error('Venda não encontrada');
  }
  
  sales.splice(index, 1);
};

// Dashboard methods
export const getDashboardStats = async (): Promise<DashboardStats> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const totalLeads = leads.length;
  const totalSales = sales.length;
  const conversionRate = totalLeads > 0 ? totalSales / totalLeads : 0;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.value, 0);
  
  // Calculate today's leads
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todaysLeads = leads.filter(lead => {
    const leadDate = new Date(lead.createdAt);
    return leadDate >= today;
  }).length;
  
  // Calculate confirmed sales (last 7 days)
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const confirmedSales = sales.filter(sale => {
    const saleDate = new Date(sale.date);
    return saleDate >= last7Days;
  }).length;
  
  // Calculate pending conversations
  const pendingConversations = leads.filter(lead => 
    lead.status === 'new' || lead.status === 'contacted'
  ).length;
  
  return {
    totalLeads,
    totalSales,
    conversionRate,
    totalRevenue,
    todaysLeads,
    confirmedSales,
    pendingConversations
  };
};

export const getCampaignPerformance = async (): Promise<CampaignPerformance[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Group leads by campaign
  const campaignLeads: Record<string, number> = {};
  leads.forEach(lead => {
    campaignLeads[lead.campaign] = (campaignLeads[lead.campaign] || 0) + 1;
  });
  
  // Group sales by campaign
  const campaignSales: Record<string, number> = {};
  const campaignRevenue: Record<string, number> = {};
  
  sales.forEach(sale => {
    campaignSales[sale.campaign] = (campaignSales[sale.campaign] || 0) + 1;
    campaignRevenue[sale.campaign] = (campaignRevenue[sale.campaign] || 0) + sale.value;
  });
  
  // Create performance data
  return campaigns.map(campaign => {
    const campaignName = campaign.name;
    const leadsCount = campaignLeads[campaignName] || 0;
    const salesCount = campaignSales[campaignName] || 0;
    const revenue = campaignRevenue[campaignName] || 0;
    
    return {
      campaignId: campaign.id,
      campaignName,
      leads: leadsCount,
      sales: salesCount,
      revenue,
      conversionRate: leadsCount > 0 ? salesCount / leadsCount : 0
    };
  });
};

// Track redirect to WhatsApp
export const trackRedirect = async (
  campaignId: string, 
  phone: string, 
  name?: string
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const campaign = campaigns.find(c => c.id === campaignId);
  if (!campaign) {
    throw new Error('Campanha não encontrada');
  }
  
  // Create a lead if not exists
  if (phone && !leads.some(lead => lead.phone === phone)) {
    const newLead: Lead = {
      id: generateId(),
      name: name || 'Lead via Tracking',
      phone,
      campaign: campaign.name,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    
    leads.unshift(newLead);
  }
};
