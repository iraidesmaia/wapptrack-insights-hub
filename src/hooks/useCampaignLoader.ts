
import { useState, useEffect } from 'react';
import { getCampaigns } from '@/services/dataService';
import { initFacebookPixel, trackPageView } from '@/lib/fbPixel';
import { toast } from 'sonner';
import { Campaign } from '@/types/campaign';

export const useCampaignLoader = (campaignId: string | null, debug: boolean) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pixelInitialized, setPixelInitialized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) {
        setError('ID da campanha não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        const campaigns = await getCampaigns();
        const targetCampaign = campaigns.find(c => c.id === campaignId);
        
        if (targetCampaign) {
          console.log('Campaign loaded:', targetCampaign.name, 'Redirect type:', targetCampaign.redirect_type);
          setCampaign(targetCampaign);
          
          // Initialize Facebook Pixel if there's a pixel ID
          if (targetCampaign.pixel_id) {
            const cleanPixelId = targetCampaign.pixel_id.trim();
            if (cleanPixelId) {
              const initialized = initFacebookPixel(cleanPixelId, debug);
              setPixelInitialized(initialized);
              
              if (initialized) {
                trackPageView();
                console.log('Pixel initialized with ID:', cleanPixelId);
                console.log('Campaign event type:', targetCampaign.event_type);
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
          toast.warning('Campanha não encontrada. O contato será registrado em uma campanha padrão.');
        }
      } catch (err) {
        console.error('Error loading campaign:', err);
        toast.warning('Erro ao carregar detalhes da campanha, mas você ainda pode continuar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignDetails();
  }, [campaignId, debug]);

  return {
    campaign,
    isLoading,
    pixelInitialized,
    error
  };
};
