
import { useCampaignLoader } from './useCampaignLoader';
import { useFormSubmission } from './useFormSubmission';
import { useDirectWhatsAppRedirect } from './useDirectWhatsAppRedirect';
import { CompanyBranding } from '@/types/campaign';

export const useCampaignData = (campaignId: string | null, clickId: string | null, debug: boolean) => {
  const {
    campaign,
    isLoading,
    pixelInitialized,
    error
  } = useCampaignLoader(campaignId, debug);

  const {
    handleFormSubmit,
    updateLeadWhatsAppStatus
  } = useFormSubmission(campaignId, campaign, pixelInitialized, clickId);

  const {
    handleDirectWhatsAppRedirect
  } = useDirectWhatsAppRedirect(campaignId, pixelInitialized, clickId);

  // Default company branding
  const defaultCompanyBranding = {
    logo: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150&q=80",
    title: "Sua Empresa",
    subtitle: "Sistema de Marketing Digital"
  };

  const companyBranding: CompanyBranding = {
    logo: campaign?.logo_url || defaultCompanyBranding.logo,
    title: campaign?.company_title || defaultCompanyBranding.title,
    subtitle: campaign?.company_subtitle || defaultCompanyBranding.subtitle
  };

  return {
    campaign,
    isLoading,
    error,
    pixelInitialized,
    companyBranding,
    handleFormSubmit,
    handleDirectWhatsAppRedirect,
    updateLeadWhatsAppStatus
  };
};
