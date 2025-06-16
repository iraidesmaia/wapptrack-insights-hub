
// Re-export all services from their dedicated files for backward compatibility
export {
  getLeads,
  addLead,
  updateLead,
  deleteLead
} from './leadService';

export {
  getCampaigns,
  addCampaign,
  updateCampaign,
  deleteCampaign
} from './campaignService';

export {
  getSales,
  addSale,
  updateSale,
  deleteSale
} from './saleService';

export {
  getDashboardStats,
  getDashboardStatsByPeriod,
  getCampaignPerformance,
  getMonthlyStats,
  getTimelineData,
  getFunnelPerformance, // Re-export from dashboardService
} from './dashboardService';

export {
  trackRedirect
} from './trackingService';
