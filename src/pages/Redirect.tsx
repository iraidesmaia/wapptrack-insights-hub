
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCampaigns, trackRedirect } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { initFacebookPixel, trackPageView, trackEventByType, togglePixelDebug } from '@/lib/fbPixel';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pixelInitialized, setPixelInitialized] = useState(false);
  const [campaign, setCampaign] = useState<{ 
    name: string; 
    pixelId?: string; 
    whatsappNumber?: string; 
    eventType?: string;
    customMessage?: string;
  } | null>(null);

  // Enable debug mode if "debug=true" is in the URL
  const debug = searchParams.get('debug') === 'true';

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">WappTrack</h1>
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
