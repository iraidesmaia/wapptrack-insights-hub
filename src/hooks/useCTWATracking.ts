import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { captureClickToWhatsAppData, CTWAClickData } from '@/services/ctwaCampaignTracker';
import { collectUrlParameters } from '@/lib/dataCollection';

export const useCTWATracking = (campaign?: Campaign | null) => {
  const [isCTWACampaign, setIsCTWACampaign] = useState(false);
  const [ctwaCLid, setCTWACLid] = useState<string | null>(null);
  const [clickData, setClickData] = useState<CTWAClickData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    // Verificar se há ctwa_clid na URL
    const { tracking } = collectUrlParameters();
    
    if (tracking.ctwa_clid) {
      console.log('🎯 [CTWA HOOK] CTWA campaign detected:', tracking.ctwa_clid);
      setIsCTWACampaign(true);
      setCTWACLid(tracking.ctwa_clid);
    } else {
      setIsCTWACampaign(false);
      setCTWACLid(null);
    }
  }, []);

  const captureClickData = async (campaignId: string): Promise<CTWAClickData | null> => {
    if (!isCTWACampaign || !ctwaCLid) {
      console.log('⚠️ [CTWA HOOK] Not a CTWA campaign, skipping capture');
      return null;
    }

    setIsCapturing(true);
    
    try {
      console.log('🎯 [CTWA HOOK] Capturing click data for campaign:', campaignId);
      
      const capturedData = await captureClickToWhatsAppData(campaignId);
      
      if (capturedData) {
        setClickData(capturedData);
        console.log('✅ [CTWA HOOK] Click data captured successfully:', {
          ctwa_clid: capturedData.ctwa_clid,
          campaign_id: capturedData.campaign_id,
          ip_address: capturedData.ip_address
        });
        
        return capturedData;
      } else {
        console.log('❌ [CTWA HOOK] Failed to capture click data');
        return null;
      }
      
    } catch (error) {
      console.error('❌ [CTWA HOOK] Error capturing click data:', error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const getCTWAStatus = () => {
    return {
      isCTWACampaign,
      ctwaCLid,
      hasClickData: !!clickData,
      isCapturing
    };
  };

  const getCTWAMetadata = () => {
    if (!clickData) return null;
    
    return {
      ctwa_clid: clickData.ctwa_clid,
      campaign_id: clickData.campaign_id,
      ip_address: clickData.ip_address,
      device_type: clickData.device_type,
      utm_source: clickData.utm_source,
      utm_medium: clickData.utm_medium,
      utm_campaign: clickData.utm_campaign,
      source_id: clickData.source_id,
      media_url: clickData.media_url,
      timestamp: clickData.timestamp
    };
  };

  return {
    // Estado
    isCTWACampaign,
    ctwaCLid,
    clickData,
    isCapturing,
    
    // Ações
    captureClickData,
    
    // Getters
    getCTWAStatus,
    getCTWAMetadata
  };
};