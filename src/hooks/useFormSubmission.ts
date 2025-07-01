import { trackRedirect, updateLead } from '@/services/dataService';
import { toast } from 'sonner';
import { sendWebhookData } from '@/services/webhookService';
import { Lead } from '@/types';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';

type UTMVars = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  ctwa_clid?: string;
  source_id?: string;
  media_url?: string;
  ad_id?: string;
  facebook_ad_id?: string;
  ttclid?: string;
};

export const useFormSubmission = (
  campaignId: string | null,
  campaign: Campaign | null,
  pixelInitialized: boolean
) => {
  const { trackEnhancedLead } = useEnhancedPixelTracking(campaign);

  const updateLeadWhatsAppStatus = async (leadId: string, delivered: boolean) => {
    try {
      const status: Lead['status'] = delivered ? 'lead' : 'to_recover';
      const updateData: Partial<Lead> = {
        status,
        whatsapp_delivery_attempts: delivered ? 1 : 1,
        last_whatsapp_attempt: new Date().toISOString()
      };
      
      await updateLead(leadId, updateData);
      console.log(`✅ Lead status updated to: ${status}`);
    } catch (error) {
      console.error('❌ Error updating lead WhatsApp status:', error);
    }
  };

  const handleFormSubmit = async (phone: string, name: string, email?: string) => {
    if (!campaignId) {
      console.error('❌ ID da campanha não encontrado');
      throw new Error('ID da campanha não encontrado');
    }

    console.log('📝 Processing form submission...', {
      campaignId,
      phone,
      name,
      campaign: campaign?.name
    });

    // Track enhanced lead event BEFORE processing
    if (campaign && trackEnhancedLead) {
      try {
        console.log('📊 Tracking enhanced lead event...');
        await trackEnhancedLead({
          name,
          phone,
          email,
          value: 100
        });
        console.log('✅ Enhanced lead tracking completed');
      } catch (trackingError) {
        console.warn('⚠️ Enhanced lead tracking failed, continuing with form processing:', trackingError);
      }
    }

    // Send data via external webhook if configured
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
            lead_email: email,
            timestamp: new Date().toISOString(),
            event_type: campaign?.event_type,
            user_id: 'public_form' // Identificador para formulários públicos
          };
          
          await sendWebhookData(config.webhook_url, webhookData);
          console.log('✅ Data sent via external webhook successfully');
        }
      }
    } catch (error) {
      console.error('❌ Error sending data via external webhook:', error);
    }

    // 🎯 COLETA SEPARADA DE UTMs E PARÂMETROS DE TRACKING
    const { utm, tracking } = collectUrlParameters();
    console.log('🌐 Parâmetros coletados e validados:', {
      utm_parameters: utm,
      tracking_parameters: tracking
    });

    console.log('📱 Processando formulário via trackRedirect...');
    
    try {
      const result = await trackRedirect(
        campaignId, 
        phone, 
        name, 
        campaign?.event_type,
        {
          // UTMs validados
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          utm_content: utm.utm_content,
          utm_term: utm.utm_term,
          // Parâmetros de tracking separados
          gclid: tracking.gclid,
          fbclid: tracking.fbclid,
          ctwa_clid: tracking.ctwa_clid,
          source_id: tracking.source_id,
          media_url: tracking.media_url
        }
      );
      
      console.log('✅ trackRedirect executado:', result);
      
      // Get target WhatsApp number
      const targetPhone = result.targetPhone || campaign?.whatsapp_number;
      
      if (!targetPhone) {
        console.warn('⚠️ Número de WhatsApp não configurado para esta campanha');
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
      
      console.log('↗️ Redirecting to WhatsApp with URL:', whatsappUrl);
      
      toast.success('Lead salvo! Redirecionando para o WhatsApp...');
      window.location.href = whatsappUrl;
      
      console.log('✅ WhatsApp redirect initiated');
    } catch (error) {
      console.error('❌ Error in trackRedirect or WhatsApp redirect:', error);
      throw new Error('Erro ao processar redirecionamento');
    }
  };

  return {
    handleFormSubmit,
    updateLeadWhatsAppStatus
  };
};
