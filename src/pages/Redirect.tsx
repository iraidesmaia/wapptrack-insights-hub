
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { togglePixelDebug } from '@/lib/fbPixel';
import BrandingSection from '@/components/BrandingSection';
import LoadingScreen from '@/components/LoadingScreen';
import ContactForm from '@/components/ContactForm';
import { useCampaignData } from '@/hooks/useCampaignData';
import { useDeviceData } from '@/hooks/useDeviceData';
import { captureDeviceData, saveDeviceData } from '@/services/deviceDataService';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const debug = searchParams.get('debug') === 'true';
  
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const redirectExecuted = useRef(false);

  const {
    campaign,
    isLoading,
    error,
    companyBranding,
    handleFormSubmit,
    handleDirectWhatsAppRedirect
  } = useCampaignData(campaignId, debug);

  // 📱 CAPTURAR DADOS DO DISPOSITIVO AUTOMATICAMENTE  
  const { deviceData, isLoading: deviceLoading } = useDeviceData();

  // 📱 EFEITO PARA CAPTURAR E SALVAR DADOS DO DISPOSITIVO IMEDIATAMENTE
  useEffect(() => {
    const captureAndSaveDeviceData = async () => {
      try {
        console.log('📱 Capturando dados do dispositivo na página de redirecionamento...');
        const data = await captureDeviceData();
        
        // Log dos dados capturados para debug
        console.log('📱 Dados capturados:', {
          browser: data.browser,
          device_type: data.device_type,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign,
          utm_content: data.utm_content,
          utm_term: data.utm_term,
          source_id: data.source_id,
          media_url: data.media_url,
          ctwa_clid: data.ctwa_clid,
          facebook_ad_id: data.facebook_ad_id
        });
        
        // Salvar os dados temporariamente em sessionStorage para correlação futura
        sessionStorage.setItem('temp_device_data', JSON.stringify(data));
        console.log('✅ Dados do dispositivo salvos temporariamente para correlação');
        
      } catch (error) {
        console.error('❌ Erro ao capturar dados do dispositivo:', error);
      }
    };

    // Capturar dados imediatamente quando a página carrega
    captureAndSaveDeviceData();
  }, []); // Executar apenas uma vez quando o componente montar

  useEffect(() => {
    // Handle direct WhatsApp redirect - só executar uma vez quando a campanha for carregada
    if (campaign && 
        campaign.redirect_type === 'whatsapp' && 
        !isLoading && 
        !redirectExecuted.current) {
      
      redirectExecuted.current = true;
      console.log('Starting direct WhatsApp redirect for campaign:', campaign.name);
      setShowLoadingScreen(true);
      
      // Start loading animation
      let progress = 0;
      const interval = setInterval(() => {
        progress += 100 / 30; // 30 frames over 3 seconds
        setLoadingProgress(Math.min(progress, 100));
      }, 100);

      // Redirect after 3 seconds
      setTimeout(async () => {
        clearInterval(interval);
        try {
          await handleDirectWhatsAppRedirect(campaign);
        } catch (err) {
          console.error('Error in direct redirect:', err);
          setShowLoadingScreen(false);
          redirectExecuted.current = false;
        }
      }, 3000);
    }
  }, [campaign, isLoading, handleDirectWhatsAppRedirect]);

  const onFormSubmit = async (phone: string, name: string) => {
    setLoading(true);
    try {
      await handleFormSubmit(phone, name);
    } catch (err) {
      console.error('Error in form submit:', err);
    } finally {
      setLoading(false);
    }
  };

  // Function to toggle debug mode
  const handleToggleDebug = () => {
    togglePixelDebug(!debug);
    const newUrl = new URL(window.location.href);
    if (!debug) {
      newUrl.searchParams.set('debug', 'true');
    } else {
      newUrl.searchParams.delete('debug');
    }
    window.history.replaceState({}, '', newUrl.toString());
    window.location.reload();
  };

  // Show loading screen for direct WhatsApp redirect
  if (showLoadingScreen && campaign?.redirect_type === 'whatsapp') {
    return <LoadingScreen progress={loadingProgress} />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Ocorreu um problema ao processar seu redirecionamento</CardDescription>
          </CardHeader>
          <CardContent>{error}</CardContent>
          <CardFooter>
            <Button onClick={() => window.location.href = '/'} className="w-full">
              Voltar ao Início
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Se ainda está carregando a campanha, mostrar loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <BrandingSection
            isLoading={true}
            logo={companyBranding.logo}
            title={companyBranding.title}
            subtitle={companyBranding.subtitle}
            campaignName=""
          />
        </div>
      </div>
    );
  }

  // Se é redirecionamento direto e já está processando, não mostrar o formulário
  if (campaign?.redirect_type === 'whatsapp' && showLoadingScreen) {
    return null;
  }

  // Mostrar formulário para campanhas de formulário ou se não há redirecionamento direto
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <BrandingSection
          isLoading={isLoading}
          logo={companyBranding.logo}
          title={companyBranding.title}
          subtitle={companyBranding.subtitle}
          campaignName={campaign?.name}
        />

        {/* Hidden debug information */}
        <div style={{ display: 'none' }}>
          <div className="mt-2">
            <button 
              className="text-xs text-gray-500 underline"
              onClick={handleToggleDebug}
            >
              {debug ? 'Desativar Debug' : 'Ativar Debug'}
            </button>
          </div>
        </div>
        
        <ContactForm onSubmit={onFormSubmit} loading={loading} />
      </div>
    </div>
  );
};

export default Redirect;
