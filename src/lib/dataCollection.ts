
type UTMVars = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  ctwa_clid?: string;
  source_id?: string;
  media_url?: string;
  ad_id?: string;
  facebook_ad_id?: string;
  ttclid?: string;
};

export type UrlParameters = UTMVars;

export type DeviceData = {
  userAgent: string;
  deviceType: string;
  browserName: string;
  operatingSystem: string;
  screenResolution: string;
  language: string;
  timezone: string;
};

export type SessionData = {
  sessionId: string;
  visitorId: string;
  timeOnPage: number;
  scrollDepth: number;
  pageViews: number;
  engagementScore: number;
  clickCount: number;
};

export type ContextData = {
  currentUrl: string;
  sourceUrl: string;
  referrer: string;
  title: string;
  path: string;
  loadTime: number;
};

export type FacebookData = {
  fbc?: string;
  fbp?: string;
  advancedMatchingData?: any;
};

export type GeolocationData = {
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
};

export const collectDeviceData = (): DeviceData => {
  return {
    userAgent: navigator.userAgent,
    deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
    browserName: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                 navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                 navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
    operatingSystem: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

export const collectSessionData = (): SessionData => {
  const sessionId = sessionStorage.getItem('session_id') || Math.random().toString(36);
  const visitorId = localStorage.getItem('visitor_id') || Math.random().toString(36);
  
  if (!sessionStorage.getItem('session_id')) {
    sessionStorage.setItem('session_id', sessionId);
  }
  if (!localStorage.getItem('visitor_id')) {
    localStorage.setItem('visitor_id', visitorId);
  }

  return {
    sessionId,
    visitorId,
    timeOnPage: Math.floor((Date.now() - performance.timing.navigationStart) / 1000),
    scrollDepth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0,
    pageViews: parseInt(sessionStorage.getItem('page_views') || '1'),
    engagementScore: 50, // Default engagement score
    clickCount: parseInt(sessionStorage.getItem('click_count') || '0')
  };
};

export const collectContextData = (): ContextData => {
  return {
    currentUrl: window.location.href,
    sourceUrl: document.referrer,
    referrer: document.referrer,
    title: document.title,
    path: window.location.pathname,
    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
  };
};

export const collectFacebookData = (): FacebookData => {
  const fbc = localStorage.getItem('_fbc') || undefined;
  const fbp = localStorage.getItem('_fbp') || undefined;
  
  return {
    fbc,
    fbp,
    advancedMatchingData: {}
  };
};

export const collectGeolocationData = async (): Promise<GeolocationData> => {
  try {
    // Simple geolocation data collection
    return new Promise((resolve) => {
      resolve({
        ipAddress: undefined, // Would need external service
        country: undefined,
        region: undefined,
        city: undefined,
        latitude: undefined,
        longitude: undefined
      });
    });
  } catch (error) {
    console.warn('Geolocation collection failed:', error);
    return {};
  }
};

export const initializeEventTracking = () => {
  // Initialize event tracking
  let clickCount = 0;
  document.addEventListener('click', () => {
    clickCount++;
    sessionStorage.setItem('click_count', clickCount.toString());
  });
  
  // Track page views
  const pageViews = parseInt(sessionStorage.getItem('page_views') || '0') + 1;
  sessionStorage.setItem('page_views', pageViews.toString());
};

export const collectUrlParameters = (): UTMVars => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utmVars: UTMVars = {};
    
    // Standard UTM parameters
    const utmParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      const value = params.get(param);
      if (value) {
        utmVars[param as keyof UTMVars] = value;
      }
    });
    
    // Google Ads click ID
    const gclid = params.get('gclid');
    if (gclid) {
      utmVars.gclid = gclid;
      // Save to localStorage for persistence
      localStorage.setItem('_gclid', gclid);
    }
    
    // Facebook click ID  
    const fbclid = params.get('fbclid');
    if (fbclid) {
      utmVars.fbclid = fbclid;
      // Save to localStorage for persistence
      localStorage.setItem('_fbclid', fbclid);
    }

    // TikTok click ID
    const ttclid = params.get('ttclid');
    if (ttclid) {
      utmVars.ttclid = ttclid;
      // Save to localStorage for persistence
      localStorage.setItem('_ttclid', ttclid);
    }

    // META CLICK-TO-WHATSAPP ID (PRIORIDADE MÁXIMA)
    const ctwaCLid = params.get('ctwa_clid');
    if (ctwaCLid) {
      utmVars.ctwa_clid = ctwaCLid;
      // Save to localStorage for persistence
      localStorage.setItem('_ctwa_clid', ctwaCLid);
      console.log('🎯 [CTWA] Click-to-WhatsApp ID detectado e salvo:', ctwaCLid);
    }

    // NOVOS PARÂMETROS DE TRACKING AVANÇADO
    const sourceId = params.get('source_id');
    if (sourceId) {
      utmVars.source_id = sourceId;
      localStorage.setItem('_source_id', sourceId);
    }

    const mediaUrl = params.get('media_url');
    if (mediaUrl) {
      utmVars.media_url = mediaUrl;
      localStorage.setItem('_media_url', mediaUrl);
    }

    // Facebook Ad ID parameters
    const adId = params.get('ad_id');
    if (adId) {
      utmVars.ad_id = adId;
      localStorage.setItem('_ad_id', adId);
    }

    const facebookAdId = params.get('facebook_ad_id');
    if (facebookAdId) {
      utmVars.facebook_ad_id = facebookAdId;
      localStorage.setItem('_facebook_ad_id', facebookAdId);
    }

    // RECUPERAR PARÂMETROS DO LOCALSTORAGE SE NÃO ESTIVEREM NA URL
    if (!utmVars.gclid) {
      const storedGclid = localStorage.getItem('_gclid');
      if (storedGclid) utmVars.gclid = storedGclid;
    }

    if (!utmVars.fbclid) {
      const storedFbclid = localStorage.getItem('_fbclid');
      if (storedFbclid) utmVars.fbclid = storedFbclid;
    }

    if (!utmVars.ttclid) {
      const storedTtclid = localStorage.getItem('_ttclid');
      if (storedTtclid) utmVars.ttclid = storedTtclid;
    }

    if (!utmVars.ctwa_clid) {
      const storedCtwaCLid = localStorage.getItem('_ctwa_clid');
      if (storedCtwaCLid) {
        utmVars.ctwa_clid = storedCtwaCLid;
        console.log('🎯 [CTWA] Click-to-WhatsApp ID recuperado do localStorage:', storedCtwaCLid);
      }
    }

    if (!utmVars.source_id) {
      const storedSourceId = localStorage.getItem('_source_id');
      if (storedSourceId) utmVars.source_id = storedSourceId;
    }

    if (!utmVars.media_url) {
      const storedMediaUrl = localStorage.getItem('_media_url');
      if (storedMediaUrl) utmVars.media_url = storedMediaUrl;
    }

    if (!utmVars.ad_id) {
      const storedAdId = localStorage.getItem('_ad_id');
      if (storedAdId) utmVars.ad_id = storedAdId;
    }

    if (!utmVars.facebook_ad_id) {
      const storedFacebookAdId = localStorage.getItem('_facebook_ad_id');
      if (storedFacebookAdId) utmVars.facebook_ad_id = storedFacebookAdId;
    }

    console.log('📊 [DATA COLLECTION] Parâmetros coletados com novos campos:', {
      ...utmVars,
      has_ctwa_clid: !!utmVars.ctwa_clid,
      has_source_id: !!utmVars.source_id,
      has_media_url: !!utmVars.media_url,
      has_ad_id: !!utmVars.ad_id,
      has_facebook_ad_id: !!utmVars.facebook_ad_id,
      has_ttclid: !!utmVars.ttclid
    });
    
    return utmVars;
  } catch (error) {
    console.error('❌ [DATA COLLECTION] Erro ao coletar parâmetros da URL:', error);
    return {};
  }
};

