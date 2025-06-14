
import { useState, useEffect } from 'react';
import { getCampaigns, trackRedirect, updateLead } from '@/services/dataService';
import { initFacebookPixel, trackPageView, trackEventByType } from '@/lib/fbPixel';
import { toast } from 'sonner';
import { sendWebhookData } from '@/services/webhookService';
import { sendToEvolutionAPI } from '@/services/evolutionApiService';
import { Lead } from '@/types';

interface Campaign {
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
    logo: campaign?.logo_url || defaultCompanyBranding.logo,
    title: campaign?.company_title || defaultCompanyBranding.title,
    subtitle: campaign?.company_subtitle || defaultCompanyBranding.subtitle
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
          if (targetCampaign.pixel_id) {
            const cleanPixelId = targetCampaign.pixel_id.trim();
            if (cleanPixelId) {
              const initialized = initFacebookPixel(cleanPixelId, debug);
              setPixelInitialized(initialized);
              
              if (initialized) {
                trackPageView();
                console.log('Pixel initialized with ID:', cleanPixelId);
                console.log('Campaign event type:', targetCampaign.event_type);
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

  const updateLeadWhatsAppStatus = async (leadId: string, delivered: boolean) => {
    try {
      const status: Lead['status'] = delivered ? 'lead' : 'to_recover';
      const updateData: Partial<Lead> = {
        status,
        whatsapp_delivery_attempts: delivered ? 1 : 1,
        last_whatsapp_attempt: new Date().toISOString()
      };
      
      await updateLead(leadId, updateData);
      console.log(`Lead status updated to: ${status}`);
    } catch (error) {
      console.error('Error updating lead WhatsApp status:', error);
    }
  };

  const handleFormSubmit = async (phone: string, name: string) => {
    if (!campaignId) {
      throw new Error('ID da campanha não encontrado');
    }

    // Enviar dados via webhook externo se configurado
    try {
      const webhookConfig = localStorage.getItem('webhook_config');
      if (webhookConfig) {
        const config = JSON.parse(webhookConfig);
        if (config.webhook_url) {
          const webhookData = {
            campaign_id: campaignId,
            campaign_name: campaign?.name,
            lead_name: name,
            lead_phone: phone,
            timestamp: new Date().toISOString(),
            event_type: campaign?.event_type
          };
          
          await sendWebhookData(config.webhook_url, webhookData);
          console.log('Dados enviados via webhook externo com sucesso');
        }
      }
    } catch (error) {
      console.error('Erro ao enviar dados via webhook externo:', error);
      // Não interromper o fluxo se o webhook externo falhar
    }

    // Track the event before processing
    if (campaign && campaign.event_type && pixelInitialized) {
      console.log('Tracking event before processing:', campaign.event_type);
      const success = trackEventByType(campaign.event_type);
      if (success) {
        console.log('Event tracked successfully');
      } else {
        console.warn('Failed to track event:', campaign.event_type);
      }
    }

    // Verificar se Evolution API está configurada
    const evolutionConfigStr = localStorage.getItem('evolution_config');
    
    if (evolutionConfigStr) {
      try {
        const evolutionConfig = JSON.parse(evolutionConfigStr);
        
        if (evolutionConfig.evolution_api_key && evolutionConfig.evolution_instance_name) {
          console.log('Using Evolution API for lead processing...');
          
          // Enviar via Evolution API
          const result = await sendToEvolutionAPI({
            campaignId,
            campaignName: campaign?.name || 'Default Campaign',
            phone,
            name,
            message: campaign?.custom_message
          });

          if (result.success) {
            toast.success('Mensagem enviada! Aguarde a confirmação de entrega.');
            console.log('Lead sent to Evolution API successfully');
            
            // Redirecionar para uma página de confirmação ou aguardar webhook
            return;
          } else {
            throw new Error(result.error || 'Erro ao enviar via Evolution API');
          }
        }
      } catch (error) {
        console.error('Error with Evolution API:', error);
        toast.error('Erro ao processar via Evolution API. Tentando método alternativo...');
        // Continuar com o fluxo tradicional
      }
    }

    // Fluxo tradicional (fallback)
    console.log('Using traditional WhatsApp redirect...');
    
    // Track the redirect in our system
    const result = await trackRedirect(campaignId, phone, name, campaign?.event_type);
    
    // Get target WhatsApp number
    const targetPhone = result.targetPhone || campaign?.whatsapp_number;
    
    if (!targetPhone) {
      console.warn('Número de WhatsApp não configurado para esta campanha');
      toast.error('Número de WhatsApp não configurado para esta campanha');
      throw new Error('Número de WhatsApp não configurado');
    }
    
    // Build WhatsApp URL with custom message
    let whatsappUrl = `https://wa.me/${targetPhone}`;
    
    if (campaign?.custom_message) {
      let message = campaign.custom_message;
      if (name) {
        message = message.replace(/\{nome\}/gi, name);
      }
      message = message.replace(/\{telefone\}/gi, phone);
      
      const encodedMessage = encodeURIComponent(message);
      whatsappUrl += `?text=${encodedMessage}`;
    }
    
    try {
      console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
      console.log('WhatsApp redirect successful');
      
      window.location.href = whatsappUrl;
    } catch (error) {
      console.error('Error redirecting to WhatsApp:', error);
      throw new Error('Erro ao redirecionar para WhatsApp');
    }
  };

  const handleDirectWhatsAppRedirect = async (campaignData: Campaign) => {
    try {
      // Track the event
      if (campaignData.event_type && pixelInitialized) {
        console.log('Tracking event before redirect:', campaignData.event_type);
        const success = trackEventByType(campaignData.event_type);
        if (success) {
          console.log('Event tracked successfully');
        } else {
          console.warn('Failed to track event:', campaignData.event_type);
        }
      }
      
      // Track the redirect in our system
      const result = await trackRedirect(campaignId!, '', '', campaignData.event_type);
      
      // Get target WhatsApp number
      const targetPhone = result.targetPhone || campaignData.whatsapp_number;
      
      if (!targetPhone) {
        console.warn('Número de WhatsApp não configurado para esta campanha');
        toast.error('Número de WhatsApp não configurado para esta campanha');
        throw new Error('Número de WhatsApp não configurado');
      }
      
      // Build WhatsApp URL
      let whatsappUrl = `https://wa.me/${targetPhone}`;
      
      if (campaignData.custom_message) {
        const encodedMessage = encodeURIComponent(campaignData.custom_message);
        whatsappUrl += `?text=${encodedMessage}`;
      }
      
      // Tentar redirecionar para o WhatsApp
      try {
        console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
        console.log('WhatsApp redirect successful');
        
        window.location.href = whatsappUrl;
      } catch (error) {
        console.error('Error redirecting to WhatsApp:', error);
        throw new Error('Erro ao redirecionar para WhatsApp');
      }
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
