
import { trackRedirect, updateLead } from '@/services/dataService';
import { trackEventByType } from '@/lib/fbPixel';
import { toast } from 'sonner';
import { sendWebhookData } from '@/services/webhookService';
import { sendToEvolutionAPI } from '@/services/evolutionApiService';
import { Lead } from '@/types';
import { Campaign } from '@/types/campaign';

export const useFormSubmission = (
  campaignId: string | null,
  campaign: Campaign | null,
  pixelInitialized: boolean
) => {
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

  return {
    handleFormSubmit,
    updateLeadWhatsAppStatus
  };
};
