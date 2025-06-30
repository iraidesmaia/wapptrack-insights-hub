
import { trackRedirect } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters } from '@/lib/dataCollection';
import { saveTrackingData } from '@/services/sessionTrackingService';

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
      console.log('🔄 Processing direct WhatsApp redirect for campaign (PUBLIC):', campaignData.name, {
        phone: options?.phone,
        name: options?.name,
        utms: options?.utms
      });

      // ✅ COLETA UTMs DA URL ATUAL SE NÃO FORAM FORNECIDOS
      const currentUtms = options?.utms || collectUrlParameters();
      
      // 🎯 PRIORIDADE PARA CTWA_CLID
      if (currentUtms.ctwa_clid) {
        console.log('🎯 [CTWA] CTWA_CLID DETECTADO NO REDIRECIONAMENTO:', currentUtms.ctwa_clid);
        
        // Garantir que está salvo no localStorage
        localStorage.setItem('_ctwa_clid', currentUtms.ctwa_clid);
        
        // Adicionar informações específicas do Meta Ads
        currentUtms.utm_source = currentUtms.utm_source || 'facebook';
        currentUtms.utm_medium = currentUtms.utm_medium || 'cpc';
        currentUtms.utm_campaign = currentUtms.utm_campaign || `ctwa_${currentUtms.ctwa_clid.substring(0, 8)}`;
      }
      
      console.log('🌐 UTMs para redirecionamento direto com CTWA:', currentUtms);

      // Inicializa tracking avançado se necessário
      if (campaignData.event_type && pixelInitialized) {
        try {
          const { trackEnhancedCustomEvent } = useEnhancedPixelTracking(campaignData);

          console.log('📊 Tracking enhanced event before redirect:', campaignData.event_type);

          await trackEnhancedCustomEvent(campaignData.event_type, {
            redirect_type: 'direct_whatsapp',
            campaign_name: campaignData.name,
            // 🆕 INCLUIR DADOS DO CTWA
            has_ctwa_clid: !!currentUtms.ctwa_clid,
            ctwa_clid: currentUtms.ctwa_clid?.substring(0, 16) || null
          });
          console.log('✅ Enhanced event tracked successfully');
        } catch (trackingError) {
          console.warn('⚠️ Enhanced tracking failed, continuing with redirect:', trackingError);
        }
      }

      // 🆕 SALVAR DADOS DE TRACKING COM IDENTIFICADORES ÚNICOS E CTWA_CLID
      try {
        const trackingResult = await saveTrackingData(currentUtms, campaignId!);
        if (trackingResult.success) {
          console.log('✅ Dados de tracking salvos com CTWA:', {
            session_id: trackingResult.session_id,
            browser_fingerprint: trackingResult.browser_fingerprint,
            campaign_id: campaignId,
            ctwa_clid: currentUtms.ctwa_clid || 'none'
          });
        }
      } catch (trackingError) {
        console.warn('⚠️ Erro ao salvar tracking data, continuando...:', trackingError);
      }

      // ✅ SALVAR O REDIRECIONAMENTO DIRETO (PÚBLICO - COM CTWA_CLID)
      try {
        const result = await trackRedirect(
          campaignId!, 
          'Redirecionamento Direto', // Sem telefone ainda
          options?.name || 'Visitante',
          campaignData.event_type,
          currentUtms // Inclui ctwa_clid e outros novos parâmetros
        );
        
        console.log('✅ Redirecionamento direto salvo com CTWA (PUBLIC):', {
          ...result,
          ctwa_clid: currentUtms.ctwa_clid || 'none'
        });
        
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

        console.log('↗️ Redirecting to WhatsApp with URL (PUBLIC):', whatsappUrl);

        toast.success('Redirecionando para o WhatsApp...');
        window.location.href = whatsappUrl;
        console.log('✅ WhatsApp redirect initiated successfully (PUBLIC)');
        
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

    } catch (err) {
      console.error('❌ Error in direct WhatsApp redirect (PUBLIC):', err);
      toast.error('Erro ao processar redirecionamento direto');
      throw new Error('Erro ao processar redirecionamento direto');
    }
  };

  return {
    handleDirectWhatsAppRedirect
  };
};
