
import { useState, useEffect } from 'react';
import { getCampaigns } from '@/services/dataService';
import { getCampaignForRedirect } from '@/services/campaignService';
import { toast } from 'sonner';
import { Campaign } from '@/types';
import { useEnhancedPixelTracking } from './useEnhancedPixelTracking';

export const useCampaignLoader = (campaignId: string | null, debug: boolean) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Use enhanced pixel tracking
  const {
    trackEnhancedPageView,
    logTrackingSummary,
    isReady: trackingReady
  } = useEnhancedPixelTracking(campaign, debug);

  useEffect(() => {
    const loadCampaignDetails = async () => {
      if (!campaignId) {
        setError('ID da campanha não encontrado');
        setIsLoading(false);
        return;
      }

      try {
        // First try to get campaigns with authentication (for logged-in users)
        try {
          const campaigns = await getCampaigns();
          const targetCampaign = campaigns.find(c => c.id === campaignId);
          
          if (targetCampaign) {
            console.log('📋 Campaign loaded (authenticated):', targetCampaign.name, 'Redirect type:', targetCampaign.redirect_type);
            setCampaign(targetCampaign);
            return;
          }
        } catch (authError) {
          // If authenticated call fails, try public redirect function
          console.log('📋 Trying public campaign access for redirect...');
        }

        // Fallback to public redirect function for unauthenticated users
        const publicCampaign = await getCampaignForRedirect(campaignId);
        
        if (publicCampaign) {
          console.log('📋 Campaign loaded (public):', publicCampaign.id, 'Redirect type:', publicCampaign.redirect_type);
          // Create a minimal campaign object with only the data we have
          setCampaign({
            ...publicCampaign,
            name: 'Campanha',
            utm_source: '',
            utm_medium: '',
            utm_campaign: '',
            utm_content: '',
            utm_term: '',
            active: publicCampaign.active || true
          } as Campaign);
        } else {
          toast.warning('Campanha não encontrada. O contato será registrado em uma campanha padrão.');
        }
      } catch (err) {
        console.error('❌ Error loading campaign:', err);
        toast.warning('Erro ao carregar detalhes da campanha, mas você ainda pode continuar.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignDetails();
  }, [campaignId]);

  // Enhanced page view tracking when campaign and tracking are ready
  useEffect(() => {
    if (campaign && trackingReady && !isLoading) {
      console.log('🚀 Executing enhanced page view tracking...');
      trackEnhancedPageView();
      
      // Log comprehensive tracking summary
      setTimeout(() => {
        logTrackingSummary();
      }, 1000);
    }
  }, [campaign, trackingReady, isLoading]);

  return {
    campaign,
    isLoading,
    error,
    pixelInitialized: !!campaign?.pixel_id && trackingReady
  };
};
