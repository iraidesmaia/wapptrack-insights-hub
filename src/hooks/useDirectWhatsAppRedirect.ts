
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
      
      // Initialize tracking only if needed
      if (campaignData.event_type && pixelInitialized) {
        try {
          const { trackEnhancedCustomEvent } = useEnhancedPixelTracking(campaignData);
          
          console.log('📊 Tracking enhanced event before redirect:', campaignData.event_type);
          
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
        // Show loading message
        toast.success('Redirecionando para o WhatsApp...');
        
        // Use window.location.href for more reliable redirect
        window.location.href = whatsappUrl;
        
        console.log('✅ WhatsApp redirect initiated successfully');
      } catch (error) {
        console.error('🔄 Error with redirect, trying fallback:', error);
        window.location.href = whatsappUrl;
      }
      
    } catch (err) {
      console.error('❌ Error in direct WhatsApp redirect:', err);
      toast.error('Erro ao processar redirecionamento direto');
      throw new Error('Erro ao processar redirecionamento direto');
    }
  };

  return {
    handleDirectWhatsAppRedirect
  };
};
