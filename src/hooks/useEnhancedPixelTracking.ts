
import { useEffect } from 'react';
import { Campaign } from '@/types';
import { initFacebookPixel, trackOptimizedPageView, trackOptimizedLead, trackOptimizedEventByType } from '@/lib/fbPixel';
import { useMaximumTracking } from './useMaximumTracking';
import { supabase } from '@/integrations/supabase/client';

export const useEnhancedPixelTracking = (
  campaign: Campaign | null,
  debug: boolean = false
) => {
  const { isReady, logTrackingSummary } = useMaximumTracking(campaign);

  useEffect(() => {
    if (!campaign?.pixel_id || !isReady) return;

    console.log('🎯 Inicializando Facebook Pixel otimizado...');
    
    // Initialize Facebook Pixel
    const pixelInitialized = initFacebookPixel(campaign.pixel_id, debug);
    
    if (pixelInitialized) {
      console.log('✅ Facebook Pixel inicializado com sucesso');
      
      // Track optimized page view immediately
      trackEnhancedPageView();
      
      // Log tracking summary
      logTrackingSummary();
    }
  }, [campaign, isReady, debug]);

  const trackEnhancedPageView = async () => {
    if (!campaign) return;

    try {
      console.log('📊 Tracking optimized PageView with Facebook recommended parameters');

      // Use optimized PageView with specific parameters
      const success = trackOptimizedPageView(
        campaign.name, 
        campaign.utm_medium || 'marketing'
      );

      // Also send via Conversions API for server-side tracking
      if (success && campaign.conversion_api_enabled) {
        await sendServerSideEvent('PageView', {
          content_name: campaign.name,
          content_category: campaign.utm_medium || 'marketing'
        });
      }

    } catch (error) {
      console.error('❌ Error tracking enhanced PageView:', error);
    }
  };

  const trackEnhancedLead = async (leadData: {
    name: string;
    phone: string;
    email?: string;
    value?: number;
  }) => {
    if (!campaign) return;

    try {
      console.log('🎯 Tracking optimized Lead with Facebook recommended parameters and Advanced Matching');

      // Use optimized Lead tracking with hashed personal data
      const success = await trackOptimizedLead({
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email,
        value: leadData.value || 100,
        campaignName: campaign.name,
        contentCategory: 'contato'
      });

      // Send via Conversions API for server-side tracking
      if (success && campaign.conversion_api_enabled) {
        await sendServerSideEvent('Lead', {
          name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          value: leadData.value || 100,
          campaignName: campaign.name
        });
      }

    } catch (error) {
      console.error('❌ Error tracking enhanced Lead:', error);
    }
  };

  const trackEnhancedCustomEvent = async (eventName: string, customData?: any) => {
    if (!campaign) return;

    try {
      console.log(`🔥 Tracking optimized ${eventName} with Facebook recommended parameters`);

      // Use optimized event tracking
      const success = await trackOptimizedEventByType(
        eventName,
        campaign.name,
        customData
      );

      // Send via Conversions API if enabled
      if (success && campaign.conversion_api_enabled) {
        await sendServerSideEvent(eventName, {
          campaignName: campaign.name,
          ...customData
        });
      }

    } catch (error) {
      console.error(`❌ Error tracking enhanced ${eventName}:`, error);
    }
  };

  const sendServerSideEvent = async (eventName: string, eventData: any) => {
    try {
      if (!campaign?.facebook_access_token) {
        console.warn('⚠️ No Facebook access token configured for server-side events');
        return;
      }

      // Prepare optimized user data
      const userData: any = {};
      
      if (eventData.email) userData.email = eventData.email;
      if (eventData.phone) userData.phone = eventData.phone;
      if (eventData.name) {
        const nameParts = eventData.name.trim().split(' ');
        userData.firstName = nameParts[0] || '';
        userData.lastName = nameParts.slice(1).join(' ') || '';
      }
      userData.country = 'br';

      // Prepare optimized custom data
      const customData = {
        value: eventData.value || 100,
        currency: 'BRL',
        content_name: eventData.campaignName || campaign.name,
        content_category: 'contato',
        source_url: window.location.href
      };

      const { data, error } = await supabase.functions.invoke('facebook-conversions', {
        body: {
          pixelId: campaign.pixel_id,
          accessToken: campaign.facebook_access_token,
          eventName,
          userData,
          customData,
          testEventCode: campaign.test_event_code
        }
      });

      if (error) {
        console.error('❌ Server-side event error:', error);
      } else {
        console.log('✅ Server-side event sent successfully:', {
          eventName,
          eventsReceived: data.events_received
        });
      }

    } catch (error) {
      console.error('❌ Server-side event failed:', error);
    }
  };

  return {
    trackEnhancedPageView,
    trackEnhancedLead,
    trackEnhancedCustomEvent,
    logTrackingSummary,
    isReady
  };
};
