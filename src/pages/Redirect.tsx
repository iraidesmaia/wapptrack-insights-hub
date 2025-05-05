
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getCampaigns, trackRedirect } from '@/services/dataService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { initFacebookPixel, trackPageView, trackEventByType } from '@/lib/fbPixel';

const Redirect = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('id');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [campaign, setCampaign] = useState<{ 
    name: string; 
    pixelId?: string; 
    whatsappNumber?: string; 
    eventType?: string 
  } | null>(null);

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
            initFacebookPixel(targetCampaign.pixelId);
            // Track PageView event automatically on page load
            trackPageView();
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
  }, [campaignId]);

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
      if (campaign && campaign.pixelId && campaign.eventType) {
        trackEventByType(campaign.eventType);
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
      
      // Redirect to WhatsApp
      window.location.href = `https://wa.me/${targetPhone}`;
    } catch (err) {
      console.error('Error tracking redirect:', err);
      setError('Erro ao processar redirecionamento');
      setLoading(false);
    }
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
