
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { togglePixelDebug } from '@/lib/fbPixel';
import BrandingSection from '@/components/BrandingSection';
import LoadingScreen from '@/components/LoadingScreen';
import ContactForm from '@/components/ContactForm';
import { useCampaignData } from '@/hooks/useCampaignData';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const debug = searchParams.get('debug') === 'true';

  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [manualFallback, setManualFallback] = useState(false);

  const alreadyRedirected = useRef(false);

  const {
    campaign,
    isLoading,
    error,
    companyBranding,
    handleFormSubmit,
    handleDirectWhatsAppRedirect
  } = useCampaignData(campaignId, debug);

  const performWhatsAppRedirect = () => {
    if (!campaign?.whatsapp_number) {
      setShowLoadingScreen(false);
      setManualFallback(true);
      console.warn('WhatsApp não configurado para a campanha');
      return;
    }
    let whatsappUrl = `https://wa.me/${campaign.whatsapp_number}`;
    if (campaign.custom_message) {
      whatsappUrl += `?text=${encodeURIComponent(campaign.custom_message)}`;
    }
    window.location.href = whatsappUrl;
  };

  useEffect(() => {
    // Só rodar para campanhas que são redirect_type "whatsapp"
    if (campaign?.redirect_type === 'whatsapp' && !isLoading && !alreadyRedirected.current) {
      alreadyRedirected.current = true;
      setShowLoadingScreen(true);
      setManualFallback(false);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 100 / 30;
        setLoadingProgress(Math.min(progress, 100));
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        try {
          performWhatsAppRedirect();
        } catch (err) {
          setShowLoadingScreen(false);
          setManualFallback(true);
          console.error('Erro no redirecionamento:', err);
        }
      }, 3000);

      setTimeout(() => {
        setShowLoadingScreen(false);
        setManualFallback(true);
      }, 6000);
    }
  }, [campaign, isLoading]);

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

  // 1. Erro da campanha
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

  // 2. Loading inicial enquanto busca a campanha (não mostrar nada do formulário nem branding!)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <LoadingScreen progress={loadingProgress || 10} />
      </div>
    );
  }

  // 3. Redirecionamento WhatsApp automático (carregando ou fallback manual)
  if (campaign?.redirect_type === 'whatsapp') {
    if (showLoadingScreen) {
      return <LoadingScreen progress={loadingProgress} />;
    }
    if (manualFallback) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Não foi possível redirecionar automaticamente</CardTitle>
              <CardDescription>
                Clique no botão abaixo para ser atendido no WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full mb-2"
                onClick={performWhatsAppRedirect}
              >
                Ir para o WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.location.href = '/'}
              >
                Voltar ao início
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    // Caso campanha WhatsApp, se não está em loading/loadingScreen/fallback, não renderizar nada (evita formulário blinkar)
    return null;
  }

  // 4. Fluxo padrão de formulário (apenas para redirect_type !== 'whatsapp')
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
