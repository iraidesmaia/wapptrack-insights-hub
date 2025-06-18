
import { trackRedirect, updateLead } from '@/services/dataService';
import { toast } from 'sonner';
import { sendWebhookData } from '@/services/webhookService';
import { sendToEvolutionAPI } from '@/services/evolutionApiService';
import { Lead } from '@/types';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';

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

    console.log('📝 Processing form submission (PUBLIC - NO AUTH REQUIRED)...', {
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

    // Check if Evolution API is configured
    const evolutionConfigStr = localStorage.getItem('evolution_config');
    
    if (evolutionConfigStr) {
      try {
        const evolutionConfig = JSON.parse(evolutionConfigStr);
        
        if (evolutionConfig.evolution_api_key && evolutionConfig.evolution_instance_name) {
          console.log('🤖 Using Evolution API for lead processing...');
          
          const result = await sendToEvolutionAPI({
            campaignId,
            campaignName: campaign?.name || 'Default Campaign',
            phone,
            name,
            message: campaign?.custom_message
          });

          if (result.success) {
            toast.success('Mensagem enviada! Aguarde a confirmação de entrega.');
            console.log('✅ Lead sent to Evolution API successfully');
            return;
          } else {
            throw new Error(result.error || 'Erro ao enviar via Evolution API');
          }
        }
      } catch (error) {
        console.error('❌ Error with Evolution API:', error);
        toast.error('Erro ao processar via Evolution API. Tentando método alternativo...');
      }
    }

    // Coleta UTMs atuais da URL
    const utms = collectUrlParameters();
    console.log('🌐 UTMs obtidos da URL:', utms);

    // ✅ PROCESSAMENTO PÚBLICO - SEM AUTENTICAÇÃO OBRIGATÓRIA
    console.log('📱 Processando formulário público via trackRedirect...');
    
    try {
      const result = await trackRedirect(
        campaignId, 
        phone, 
        name, 
        campaign?.event_type,
        {
          utm_source: utms.utm_source,
          utm_medium: utms.utm_medium,
          utm_campaign: utms.utm_campaign,
          utm_content: utms.utm_content,
          utm_term: utms.utm_term
        }
      );
      
      console.log('✅ trackRedirect executado com sucesso (modo público):', result);
      
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
      
      toast.success('Redirecionando para o WhatsApp...');
      window.location.href = whatsappUrl;
      
      console.log('✅ WhatsApp redirect initiated (public form)');
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
