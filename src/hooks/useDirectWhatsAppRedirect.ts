
import { trackRedirect } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';

export const useDirectWhatsAppRedirect = (
  campaignId: string | null,
  pixelInitialized: boolean
) => {
  const handleDirectWhatsAppRedirect = async (campaignData: Campaign) => {
    try {
      console.log('🔄 Processing direct WhatsApp redirect for campaign:', campaignData.name);
      
      // Track with enhanced pixel tracking
      const { trackEnhancedCustomEvent } = useEnhancedPixelTracking(campaignData);
      
      // Track enhanced event before redirect
      if (campaignData.event_type) {
        console.log('📊 Tracking enhanced event before redirect:', campaignData.event_type);
        
        try {
          await trackEnhancedCustomEvent(campaignData.event_type, {
            redirect_type: 'direct_whatsapp',
            campaign_name: campaignData.name
          });
          console.log('✅ Enhanced event tracked successfully');
        } catch (trackingError) {
          console.warn('⚠️ Enhanced tracking failed, continuing with redirect:', trackingError);
        }
      }
      
      // Track the redirect in our system
      const result = await trackRedirect(campaignId!, 'Redirecionamento Direto', 'Visitante', campaignData.event_type);
      
      // Get target WhatsApp number
      const targetPhone = result.targetPhone || campaignData.whatsapp_number;
      
      if (!targetPhone) {
        console.warn('⚠️ Número de WhatsApp não configurado para esta campanha');
        toast.error('Número de WhatsApp não configurado para esta campanha');
        throw new Error('Número de WhatsApp não configurado');
      }
      
      // Build WhatsApp URL
      let whatsappUrl = `https://wa.me/${targetPhone}`;
      
      if (campaignData.custom_message) {
        const encodedMessage = encodeURIComponent(campaignData.custom_message);
        whatsappUrl += `?text=${encodedMessage}`;
      }
      
      // Redirect to WhatsApp with fallback
      console.log('↗️ Redirecting to WhatsApp with URL:', whatsappUrl);
      
      try {
        // Try to open in new tab first
        const newWindow = window.open(whatsappUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          // If popup was blocked, use location.href as fallback
          console.log('🔄 Popup blocked, using location.href fallback');
          window.location.href = whatsappUrl;
        } else {
          console.log('✅ WhatsApp opened in new tab successfully');
          toast.success('Redirecionando para o WhatsApp...');
        }
      } catch (error) {
        // Final fallback
        console.log('🔄 Error with window.open, using location.href:', error);
        window.location.href = whatsappUrl;
      }
      
    } catch (err) {
      console.error('❌ Error in direct WhatsApp redirect:', err);
      throw new Error('Erro ao processar redirecionamento direto');
    }
  };

  return {
    handleDirectWhatsAppRedirect
  };
};
