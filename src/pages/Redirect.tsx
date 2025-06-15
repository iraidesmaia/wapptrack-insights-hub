
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
  const redirectExecuted = useRef(false);

  const {
    campaign,
    isLoading,
    error,
    companyBranding,
    handleFormSubmit,
    handleDirectWhatsAppRedirect
  } = useCampaignData(campaignId, debug);

  const onFormSubmit = async (phone: string, name: string) => {
    setLoading(true);
    try {
      // Check if it's a direct WhatsApp redirect
      if (campaign?.redirect_type === 'whatsapp') {
        // For direct WhatsApp redirect, handle differently
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
            await handleDirectWhatsAppRedirect(campaign, phone, name);
          } catch (err) {
            console.error('Error in direct redirect:', err);
            setShowLoadingScreen(false);
            setLoading(false);
          }
        }, 3000);
      } else {
        // Regular form submission
        await handleFormSubmit(phone, name);
      }
    } catch (err) {
      console.error('Error in form submit:', err);
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

  // Sempre mostrar o formulário para coletar dados do lead
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
