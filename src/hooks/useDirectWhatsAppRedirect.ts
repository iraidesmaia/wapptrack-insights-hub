
import { trackRedirect } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';

type UTMVars = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export const useDirectWhatsAppRedirect = (
  campaignId: string | null,
  pixelInitialized: boolean
) => {
  /**
   * @param campaignData Campanha carregada
   * @param options Dados extras (opcional): telefone do visitante, nome e utms, se existirem
   */
  const handleDirectWhatsAppRedirect = async (
    campaignData: Campaign,
    options?: {
      phone?: string;
      name?: string;
      utms?: UTMVars;
    }
  ) => {
    try {
      console.log('🔄 Processing direct WhatsApp redirect for campaign:', campaignData.name);
      
      // Inicializa tracking avançado se necessário
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
      
      // Track o redirecionamento no sistema, salvando telefone/nome/utms, se houver
      const result = await trackRedirect(
        campaignId!, // id da campanha
        options?.phone || 'Redirecionamento Direto', // telefone real ou nome padrão
        options?.name || 'Visitante', // nome real ou visitante
        campaignData.event_type,
        options?.utms // pode vir undefined
      );
      
      // Pega o número de destino do WhatsApp
      const targetPhone = result.targetPhone || campaignData.whatsapp_number;
      
      if (!targetPhone) {
        console.warn('⚠️ Número de WhatsApp não configurado para esta campanha');
        toast.error('Número de WhatsApp não configurado para esta campanha');
        throw new Error('Número de WhatsApp não configurado');
      }
      
      // Monta a URL do WhatsApp com mensagem personalizada
      let whatsappUrl = `https://wa.me/${targetPhone}`;
      
      if (campaignData.custom_message) {
        const encodedMessage = encodeURIComponent(campaignData.custom_message);
        whatsappUrl += `?text=${encodedMessage}`;
      }
      
      // Redireciona para o WhatsApp com fallback
      console.log('↗️ Redirecting to WhatsApp with URL:', whatsappUrl);
      
      try {
        toast.success('Redirecionando para o WhatsApp...');
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
