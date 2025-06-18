
import { trackRedirect } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';
import { supabase } from '@/integrations/supabase/client';

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
  const handleDirectWhatsAppRedirect = async (
    campaignData: Campaign,
    options?: {
      phone?: string;
      name?: string;
      utms?: UTMVars;
    }
  ) => {
    try {
      console.log('🔄 Processing direct WhatsApp redirect for campaign:', campaignData.name, {
        phone: options?.phone,
        name: options?.name,
        utms: options?.utms
      });

      // Verificar se usuário está autenticado para tracking avançado
      const { data: { user } } = await supabase.auth.getUser();

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

      // ✅ COLETA UTMs DA URL ATUAL SE NÃO FORAM FORNECIDOS
      const currentUtms = options?.utms || collectUrlParameters();
      console.log('🌐 UTMs para redirecionamento direto:', currentUtms);

      // ✅ SALVAR O REDIRECIONAMENTO DIRETO (apenas se autenticado)
      if (user) {
        try {
          const result = await trackRedirect(
            campaignId!, 
            options?.phone || 'Redirecionamento Direto',
            options?.name || 'Visitante',
            campaignData.event_type,
            currentUtms
          );
          
          console.log('✅ Redirecionamento direto salvo com sucesso:', result);
          
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

          console.log('↗️ Redirecting to WhatsApp with URL:', whatsappUrl);

          toast.success('Redirecionando para o WhatsApp...');
          window.location.href = whatsappUrl;
          console.log('✅ WhatsApp redirect initiated successfully');
          
        } catch (trackError) {
          console.error('❌ Erro ao salvar redirecionamento direto:', trackError);
          toast.error('Erro ao processar redirecionamento, mas continuando...');
          
          // Continua com o redirecionamento mesmo se houver erro no tracking
          const targetPhone = campaignData.whatsapp_number;
          if (targetPhone) {
            let whatsappUrl = `https://wa.me/${targetPhone}`;
            if (campaignData.custom_message) {
              const encodedMessage = encodeURIComponent(campaignData.custom_message);
              whatsappUrl += `?text=${encodedMessage}`;
            }
            window.location.href = whatsappUrl;
          }
        }
      } else {
        // Se não estiver autenticado, apenas redireciona sem salvar
        console.log('⚠️ Usuário não autenticado, redirecionando sem salvar tracking');
        const targetPhone = campaignData.whatsapp_number;
        if (targetPhone) {
          let whatsappUrl = `https://wa.me/${targetPhone}`;
          if (campaignData.custom_message) {
            const encodedMessage = encodeURIComponent(campaignData.custom_message);
            whatsappUrl += `?text=${encodedMessage}`;
          }
          toast.success('Redirecionando para o WhatsApp...');
          window.location.href = whatsappUrl;
        } else {
          toast.error('Número de WhatsApp não configurado para esta campanha');
        }
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
