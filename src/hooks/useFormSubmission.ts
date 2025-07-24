
import { trackRedirect, updateLead } from '@/services/dataService';
import { toast } from 'sonner';
import { sendWebhookData } from '@/services/webhookService';
import { Lead } from '@/types';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';
import { validateFormData, logSecurityEvent } from '@/lib/securityValidation';

export const useFormSubmission = (
  campaignId: string | null,
  campaign: Campaign | null,
  pixelInitialized: boolean,
  clickId?: string | null
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
      logSecurityEvent('Campaign ID not found', { campaignId }, 'medium');
      throw new Error('ID da campanha não encontrado');
    }

    // Validate and sanitize form data
    const formValidation = validateFormData({ name, phone, email });
    if (!formValidation.isValid) {
      logSecurityEvent('Form validation failed in submission', { errors: formValidation.errors }, 'medium');
      throw new Error(formValidation.errors[0]);
    }

    const sanitizedData = formValidation.sanitizedData!;

    console.log('📝 Processing form submission...', {
      campaignId,
      phone: sanitizedData.phone,
      name: sanitizedData.name,
      campaign: campaign?.name
    });

    // Track enhanced lead event BEFORE processing
    if (campaign && trackEnhancedLead) {
      try {
        console.log('📊 Tracking enhanced lead event...');
        await trackEnhancedLead({
          name: sanitizedData.name,
          phone: sanitizedData.phone,
          email: sanitizedData.email,
          value: 100
        });
        console.log('✅ Enhanced lead tracking completed');
        logSecurityEvent('Enhanced lead tracking completed', { campaignId }, 'low');
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
            lead_name: sanitizedData.name,
            lead_phone: sanitizedData.phone,
            lead_email: sanitizedData.email,
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

    // 🎯 COLETA UTMs E PARÂMETROS FACEBOOK ATUALIZADOS
    const utms = collectUrlParameters();
    console.log('🌐 UTMs e parâmetros Facebook obtidos da URL:', {
      utm_source: utms.utm_source,
      utm_medium: utms.utm_medium,
      utm_campaign: utms.utm_campaign,
      utm_content: utms.utm_content,
      utm_term: utms.utm_term,
      ad_id: utms.ad_id,
      facebook_ad_id: utms.facebook_ad_id,
      click_id: clickId
    });

    console.log('📱 Processando formulário via trackRedirect...');
    
    try {
      const result = await trackRedirect(
        campaignId, 
        sanitizedData.phone, 
        sanitizedData.name, 
        campaign?.event_type,
        {
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_content: utms.utm_content,
          utm_term: utms.utm_term
        },
        clickId || undefined
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
        if (sanitizedData.name) {
          message = message.replace(/\{nome\}/gi, sanitizedData.name);
        }
        message = message.replace(/\{telefone\}/gi, sanitizedData.phone);
        
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
