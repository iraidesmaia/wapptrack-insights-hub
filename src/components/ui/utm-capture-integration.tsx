import { useEffect, useRef } from 'react';

interface UTMCaptureIntegrationProps {
  /** URL do endpoint de captura de UTMs */
  apiEndpoint?: string;
  /** Ativar modo debug */
  debug?: boolean;
  /** Captura automática ao carregar a página */
  autoCapture?: boolean;
  /** Seletor do formulário para anexar */
  formSelector?: string;
  /** Seletor do campo de telefone */
  phoneFieldSelector?: string;
  /** Seletor dos botões do WhatsApp */
  whatsappButtonSelector?: string;
}

declare global {
  interface Window {
    WappTrackUTMCapture: any;
    wappTrackInstance: any;
  }
}

export function UTMCaptureIntegration({
  apiEndpoint = 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/utm-capture',
  debug = false,
  autoCapture = true,
  formSelector,
  phoneFieldSelector,
  whatsappButtonSelector = '.whatsapp-btn, [href*="wa.me"], [href*="whatsapp.com"]'
}: UTMCaptureIntegrationProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    
    // Função para inicializar quando o script estiver carregado
    const initializeTracking = () => {
      if (window.WappTrackUTMCapture) {
        const config = {
          apiEndpoint,
          debug,
          autoCapture
        };

        console.log('[UTM Capture] Inicializando com config:', config);
        
        window.wappTrackInstance = new window.WappTrackUTMCapture(config);
        
        // Auto-attach se configurado
        if (formSelector && phoneFieldSelector) {
          window.wappTrackInstance.attachToForm(formSelector, phoneFieldSelector);
          console.log('[UTM Capture] Anexado ao formulário:', { formSelector, phoneFieldSelector });
        }
        
        if (whatsappButtonSelector) {
          window.wappTrackInstance.attachToWhatsAppButton(whatsappButtonSelector);
          console.log('[UTM Capture] Anexado aos botões WhatsApp:', whatsappButtonSelector);
        }
        
        initialized.current = true;
      }
    };

    // Verificar se o script já foi carregado
    if (window.WappTrackUTMCapture) {
      initializeTracking();
    } else {
      // Carregar o script se não estiver carregado
      const script = document.createElement('script');
      script.src = '/src/assets/frontend-utm-capture.js';
      script.async = true;
      script.onload = initializeTracking;
      script.onerror = () => {
        console.error('[UTM Capture] Erro ao carregar script');
      };
      
      document.head.appendChild(script);
      
      return () => {
        document.head.removeChild(script);
      };
    }
  }, [apiEndpoint, debug, autoCapture, formSelector, phoneFieldSelector, whatsappButtonSelector]);

  return null; // Este componente não renderiza nada
}

/**
 * Hook para usar o sistema de captura UTM
 */
export function useUTMCapture() {
  const captureWithPhone = (phone: string) => {
    if (window.wappTrackInstance) {
      return window.wappTrackInstance.captureWithPhone(phone);
    }
    console.warn('[UTM Capture] Instância não inicializada');
    return false;
  };

  const getCapturedData = () => {
    if (window.wappTrackInstance) {
      return window.wappTrackInstance.getCapturedData();
    }
    return null;
  };

  const healthCheck = async () => {
    if (window.wappTrackInstance) {
      return await window.wappTrackInstance.healthCheck();
    }
    return { status: 'error', message: 'Instância não inicializada' };
  };

  return {
    captureWithPhone,
    getCapturedData,
    healthCheck,
    isInitialized: !!window.wappTrackInstance
  };
}