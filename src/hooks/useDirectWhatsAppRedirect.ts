
import { trackRedirect } from '@/services/dataService';
import { trackEventByType } from '@/lib/fbPixel';
import { toast } from 'sonner';
import { Campaign } from '@/types/campaign';

export const useDirectWhatsAppRedirect = (
  campaignId: string | null,
  pixelInitialized: boolean
) => {
  const handleDirectWhatsAppRedirect = async (campaignData: Campaign) => {
    try {
      console.log('Processing direct WhatsApp redirect for campaign:', campaignData.name);
      
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
      
      // Get target WhatsApp number from campaign
      const targetPhone = campaignData.whatsapp_number;
      
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
      
      // Redirecionar para o WhatsApp com fallback
      console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
      
      try {
        // Tentar abrir em nova aba primeiro
        const newWindow = window.open(whatsappUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
          // Se popup foi bloqueado, usar location.href como fallback
          console.log('Popup blocked, using location.href fallback');
          window.location.href = whatsappUrl;
        } else {
          console.log('WhatsApp opened in new tab successfully');
          // Opcional: mostrar mensagem de sucesso
          toast.success('Redirecionando para o WhatsApp...');
        }
      } catch (error) {
        // Fallback final
        console.log('Error with window.open, using location.href:', error);
        window.location.href = whatsappUrl;
      }
      
    } catch (err) {
      console.error('Error in direct WhatsApp redirect:', err);
      throw new Error('Erro ao processar redirecionamento direto');
    }
  };

  return {
    handleDirectWhatsAppRedirect
  };
};
