
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCampaigns, trackRedirect } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { initFacebookPixel, trackPageView, trackEventByType, togglePixelDebug } from '@/lib/fbPixel';
import { Progress } from '@/components/ui/progress';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixelInitialized, setPixelInitialized] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [campaign, setCampaign] = useState<{ 
    name: string; 
    pixelId?: string; 
    whatsappNumber?: string; 
    eventType?: string;
    customMessage?: string;
    companyTitle?: string;
    companySubtitle?: string;
    logoUrl?: string;
    redirectType?: string;
  } | null>(null);

  // Enable debug mode if "debug=true" is in the URL
  const debug = searchParams.get('debug') === 'true';

  // Default company branding configuration - usado quando a campanha não tem configuração personalizada
  const defaultCompanyBranding = {
    logo: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&h=150&q=80",
    title: "Sua Empresa",
    subtitle: "Sistema de Marketing Digital"
  };

  // Use campaign-specific branding if available, otherwise use default
  const companyBranding = {
    logo: campaign?.logoUrl || defaultCompanyBranding.logo,
    title: campaign?.companyTitle || defaultCompanyBranding.title,
    subtitle: campaign?.companySubtitle || defaultCompanyBranding.subtitle
  };

  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) {
        setError('ID da campanha não encontrado');
        return;
      }

      try {
        const campaigns = await getCampaigns();
        const targetCampaign = campaigns.find(c => c.id === campaignId);
        
        if (targetCampaign) {
          setCampaign(targetCampaign);
          
          // Initialize Facebook Pixel if there's a pixel ID
          if (targetCampaign.pixelId) {
            // Trim the Pixel ID and check if it's valid
            const cleanPixelId = targetCampaign.pixelId.trim();
            if (cleanPixelId) {
              const initialized = initFacebookPixel(cleanPixelId, debug);
              setPixelInitialized(initialized);
              
              // Track PageView event automatically on page load if initialized successfully
              if (initialized) {
                trackPageView();
                // For debugging purposes
                console.log('Pixel initialized with ID:', cleanPixelId);
                console.log('Campaign event type:', targetCampaign.eventType);
              } else {
                console.warn('Failed to initialize Facebook Pixel with ID:', cleanPixelId);
              }
            } else {
              console.warn('Empty Pixel ID after trimming for campaign:', targetCampaign.name);
            }
          } else {
            console.log('No Pixel ID found for campaign:', targetCampaign.name);
          }

          // If redirect type is direct to WhatsApp, start loading screen immediately
          if (targetCampaign.redirectType === 'whatsapp') {
            handleDirectWhatsAppRedirect(targetCampaign);
          }
        } else {
          // Display warning but don't prevent form submission
          toast.warning('Campanha não encontrada. O contato será registrado em uma campanha padrão.');
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
        // Display warning but don't block the form
        toast.warning('Erro ao carregar detalhes da campanha, mas você ainda pode continuar.');
      }
    };

    loadCampaignDetails();
  }, [campaignId, debug]);

  const handleDirectWhatsAppRedirect = async (campaignData: any) => {
    setShowLoadingScreen(true);
    
    // Start loading animation
    let progress = 0;
    const interval = setInterval(() => {
      progress += 100 / 30; // 30 frames over 3 seconds (100ms intervals)
      setLoadingProgress(Math.min(progress, 100));
    }, 100);

    // Track the event and redirect after 3 seconds
    setTimeout(async () => {
      clearInterval(interval);
      
      try {
        // Track the event based on the campaign's event type
        if (campaignData.eventType && pixelInitialized) {
          console.log('Tracking event before redirect:', campaignData.eventType);
          const success = trackEventByType(campaignData.eventType);
          if (success) {
            console.log('Event tracked successfully');
          } else {
            console.warn('Failed to track event:', campaignData.eventType);
          }
        }
        
        // Track the redirect in our system
        const result = await trackRedirect(campaignId!, '', '', campaignData.eventType);
        
        // Get target WhatsApp number
        const targetPhone = result.targetPhone || campaignData.whatsappNumber;
        
        if (!targetPhone) {
          toast.error('Número de WhatsApp não configurado para esta campanha');
          setShowLoadingScreen(false);
          return;
        }
        
        // Build WhatsApp URL
        let whatsappUrl = `https://wa.me/${targetPhone}`;
        
        if (campaignData.customMessage) {
          const encodedMessage = encodeURIComponent(campaignData.customMessage);
          whatsappUrl += `?text=${encodedMessage}`;
        }
        
        console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
        
        // Redirect to WhatsApp
        window.location.href = whatsappUrl;
      } catch (err) {
        console.error('Error tracking redirect:', err);
        setShowLoadingScreen(false);
        setError('Erro ao processar redirecionamento');
      }
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      setError('Por favor, informe seu WhatsApp');
      return;
    }

    if (!campaignId) {
      setError('ID da campanha não encontrado');
      return;
    }

    try {
      setLoading(true);
      
      // Track the event based on the campaign's event type before redirecting
      if (campaign && campaign.eventType && pixelInitialized) {
        console.log('Tracking event before redirect:', campaign.eventType);
        const success = trackEventByType(campaign.eventType);
        if (success) {
          console.log('Event tracked successfully');
        } else {
          console.warn('Failed to track event:', campaign.eventType);
        }
      } else {
        console.log('Not tracking any event, pixelInitialized:', pixelInitialized);
        if (campaign) {
          console.log('Campaign event type:', campaign.eventType);
        }
      }
      
      // Track the redirect in our system and get the target WhatsApp number
      const result = await trackRedirect(campaignId, phone, name, campaign?.eventType);
      
      // Format the phone number for WhatsApp - use campaign's number if available
      const targetPhone = result.targetPhone || campaign?.whatsappNumber;
      
      if (!targetPhone) {
        toast.error('Número de WhatsApp não configurado para esta campanha');
        setLoading(false);
        return;
      }
      
      // Build WhatsApp URL with custom message if available
      let whatsappUrl = `https://wa.me/${targetPhone}`;
      
      if (campaign?.customMessage) {
        // Replace variables in the custom message
        let message = campaign.customMessage;
        if (name) {
          message = message.replace(/\{nome\}/gi, name);
        }
        message = message.replace(/\{telefone\}/gi, phone);
        
        // Encode the message for URL
        const encodedMessage = encodeURIComponent(message);
        whatsappUrl += `?text=${encodedMessage}`;
      }
      
      console.log('Redirecting to WhatsApp with URL:', whatsappUrl);
      
      // Redirect to WhatsApp
      window.location.href = whatsappUrl;
    } catch (err) {
      console.error('Error tracking redirect:', err);
      setError('Erro ao processar redirecionamento');
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
  if (showLoadingScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <img
                  src={companyBranding.logo}
                  alt="Logo da empresa"
                  className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl text-primary">{companyBranding.title}</span>
                <span className="text-sm text-muted-foreground">{companyBranding.subtitle}</span>
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Redirecionando...</CardTitle>
              <CardDescription>
                Você será redirecionado para o WhatsApp em alguns segundos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
              <Progress value={loadingProgress} className="w-full" />
              <p className="text-center text-sm text-muted-foreground">
                Preparando seu atendimento...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
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

  // Only show form if campaign is not direct WhatsApp redirect
  if (campaign?.redirectType === 'whatsapp') {
    return null; // Loading screen will be shown instead
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              <img
                src={companyBranding.logo}
                alt="Logo da empresa"
                className="h-16 w-16 rounded-full object-cover border-2 border-primary/20"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-2xl text-primary">{companyBranding.title}</span>
              <span className="text-sm text-muted-foreground">{companyBranding.subtitle}</span>
            </div>
          </div>
          {campaign && <p className="mt-2 text-gray-600">Campanha: {campaign.name}</p>}
          {/* Hidden debug information - only visible in console */}
          <div style={{ display: 'none' }}>
            {campaign?.pixelId && pixelInitialized && (
              <p className="text-xs text-green-600 mt-1">Pixel ativo</p>
            )}
            {campaign?.pixelId && !pixelInitialized && (
              <p className="text-xs text-red-600 mt-1">Falha na inicialização do Pixel</p>
            )}
            <div className="mt-2">
              <button 
                className="text-xs text-gray-500 underline"
                onClick={handleToggleDebug}
              >
                {debug ? 'Desativar Debug' : 'Ativar Debug'}
              </button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Entrar em Contato</CardTitle>
            <CardDescription>
              Por favor, informe seu WhatsApp para continuar
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu nome (opcional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Seu WhatsApp*</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Redirecionando...' : 'Continuar para o WhatsApp'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Redirect;
