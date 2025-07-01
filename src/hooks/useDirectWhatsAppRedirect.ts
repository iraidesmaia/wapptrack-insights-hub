import { trackRedirect } from '@/services/dataService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';
import { collectUrlParameters, UTMParameters, TrackingParameters } from '@/lib/dataCollection';
import { useCTWATracking } from './useCTWATracking';

type CombinedTrackingData = UTMParameters & TrackingParameters;

export const useDirectWhatsAppRedirect = (
  campaignId: string | null,
  pixelInitialized: boolean
) => {
  const { isCTWACampaign, captureClickData, getCTWAStatus } = useCTWATracking();
  const handleDirectWhatsAppRedirect = async (
    campaignData: Campaign,
    options?: {
      phone?: string;
      name?: string;
      utms?: CombinedTrackingData;
    }
  ) => {
    try {
      console.log('🔄 Processing direct WhatsApp redirect for campaign (PUBLIC):', campaignData.name, {
        phone: options?.phone,
        name: options?.name,
        utms: options?.utms
      });

      // ✅ COLETA UTMs DA URL ATUAL SE NÃO FORAM FORNECIDOS
      let currentUtms: CombinedTrackingData;
      if (options?.utms) {
        currentUtms = options.utms;
      } else {
        const { utm, tracking } = collectUrlParameters();
        currentUtms = { ...utm, ...tracking };
      }
      
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

      // 🎯 CAPTURA COMPLETA DE DADOS CTWA NO CLIQUE (SE APLICÁVEL)
      if (isCTWACampaign) {
        console.log('🎯 [CTWA] Campanha CTWA detectada, capturando dados completos...');
        try {
          const clickData = await captureClickData(campaignId!);
          if (clickData) {
            console.log('✅ [CTWA] Dados completos do clique capturados:', {
              ctwa_clid: clickData.ctwa_clid,
              campaign_id: clickData.campaign_id,
              ip_address: clickData.ip_address,
              device_type: clickData.device_type
            });
          }
        } catch (trackingError) {
          console.warn('⚠️ Erro ao capturar dados CTWA, continuando...:', trackingError);
        }
      }

      // ✅ SALVAR O REDIRECIONAMENTO DIRETO (PÚBLICO - COM CTWA_CLID)
      try {
        const result = await trackRedirect(
          campaignId!, 
          'Redirecionamento Direto', // Sem telefone ainda
          options?.name || 'Visitante',
          campaignData.event_type,
          {
            // UTMs validados
            utm_source: currentUtms.utm_source,
            utm_medium: currentUtms.utm_medium,
            utm_campaign: currentUtms.utm_campaign,
            utm_content: currentUtms.utm_content,
            utm_term: currentUtms.utm_term,
            // Parâmetros de tracking separados
            gclid: currentUtms.gclid,
            fbclid: currentUtms.fbclid,
            ctwa_clid: currentUtms.ctwa_clid,
            source_id: currentUtms.source_id,
            media_url: currentUtms.media_url
          }
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
