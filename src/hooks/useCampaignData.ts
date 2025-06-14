
import { useState, useEffect } from 'react';
import { getCampaigns, trackRedirect } from '@/services/dataService';
import { initFacebookPixel, trackPageView, trackEventByType } from '@/lib/fbPixel';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
  pixelId?: string;
  whatsappNumber?: string;
  eventType?: string;
  customMessage?: string;
  companyTitle?: string;
  companySubtitle?: string;
  logoUrl?: string;
  redirectType?: string;
}

export const useCampaignData = (campaignId: string | null, debug: boolean) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pixelInitialized, setPixelInitialized] = useState(false);
  const [error, setError] = useState('');

  // Default company branding
  const defaultCompanyBranding = {
    logo: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150&q=80",
    title: "Sua Empresa",
    subtitle: "Sistema de Marketing Digital"
  };

  const companyBranding = {
    logo: campaign?.logoUrl || defaultCompanyBranding.logo,
    title: campaign?.companyTitle || defaultCompanyBranding.title,
    subtitle: campaign?.companySubtitle || defaultCompanyBranding.subtitle
  };

  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) {
        setError('ID da campanha não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const campaigns = await getCampaigns();
        const targetCampaign = campaigns.find(c => c.id === campaignId);
        
        if (targetCampaign) {
          setCampaign(targetCampaign);
          
          // Initialize Facebook Pixel if there's a pixel ID
          if (targetCampaign.pixelId) {
            const cleanPixelId = targetCampaign.pixelId.trim();
            if (cleanPixelId) {
              const initialized = initFacebookPixel(cleanPixelId, debug);
              setPixelInitialized(initialized);
              
              if (initialized) {
                trackPageView();
                console.log('Pixel initialized with ID:', cleanPixelId);
                console.log('Campaign event type:', targetCampaign.eventType);
              } else {
                console.warn('Failed to initialize Facebook Pixel with ID:', cleanPixelId);
              }
            } else {
              console.warn('Empty Pixel ID after trimming for campaign:', targetCampaign.name);
            }
          } else {
            console.log('No Pixel ID found for campaign:', targetCampaign.name);
          }
        } else {
          toast.warning('Campanha não encontrada. O contato será registrado em uma campanha padrão.');
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
        toast.warning('Erro ao carregar detalhes da campanha, mas você ainda pode continuar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignDetails();
  }, [campaignId, debug]);

  const handleFormSubmit = async (phone: string, name: string) => {
    if (!campaignId) {
      throw new Error('ID da campanha não encontrado');
    }

    // Track the event before redirecting
    if (campaign && campaign.eventType && pixelInitialized) {
      console.log('Tracking event before redirect:', campaign.eventType);
      const success = trackEventByType(campaign.eventType);
      if (success) {
        console.log('Event tracked successfully');
      } else {
        console.warn('Failed to track event:', campaign.eventType);
      }
    }
    
    // Track the redirect in our system
    const result = await trackRedirect(campaignId, phone, name, campaign?.eventType);
    
    // Get target WhatsApp number
    const targetPhone = result.targetPhone || campaign?.whatsappNumber;
    
    if (!targetPhone) {
      toast.error('Número de WhatsApp não configurado para esta campanha');
      throw new Error('Número de WhatsApp não configurado');
    }
    
    // Build WhatsApp URL with custom message
    let whatsappUrl = `https://wa.me/${targetPhone}`;
    
    if (campaign?.customMessage) {
      let message = campaign.customMessage;
      if (name) {
        message = message.replace(/\{nome\}/gi, name);
      }
      message = message.replace(/\{telefone\}/gi, phone);
      
      const encodedMessage = encodeURIComponent(message);
      whatsappUrl += `?text=${encodedMessage}`;
    }
    
    console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
    window.location.href = whatsappUrl;
  };

  const handleDirectWhatsAppRedirect = async (campaignData: Campaign) => {
    try {
      // Track the event
      if (campaignData.eventType && pixelInitialized) {
        console.log('Tracking event before redirect:', campaignData.eventType);
        const success = trackEventByType(campaignData.eventType);
        if (success) {
          console.log('Event tracked successfully');
        } else {
          console.warn('Failed to track event:', campaignData.eventType);
        }
      }
      
      // Track the redirect in our system
      const result = await trackRedirect(campaignId!, '', '', campaignData.eventType);
      
      // Get target WhatsApp number
      const targetPhone = result.targetPhone || campaignData.whatsappNumber;
      
      if (!targetPhone) {
        toast.error('Número de WhatsApp não configurado para esta campanha');
        throw new Error('Número de WhatsApp não configurado');
      }
      
      // Build WhatsApp URL
      let whatsappUrl = `https://wa.me/${targetPhone}`;
      
      if (campaignData.customMessage) {
        const encodedMessage = encodeURIComponent(campaignData.customMessage);
        whatsappUrl += `?text=${encodedMessage}`;
      }
      
      console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
      window.location.href = whatsappUrl;
    } catch (err) {
      console.error('Error tracking redirect:', err);
      throw new Error('Erro ao processar redirecionamento');
    }
  };

  return {
    campaign,
    isLoading,
    error,
    pixelInitialized,
    companyBranding,
    handleFormSubmit,
    handleDirectWhatsAppRedirect
  };
};
