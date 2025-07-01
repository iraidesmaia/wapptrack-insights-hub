
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

// Função para validar se um valor é um UTM válido
const isValidUTMValue = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  
  // Não deve ser uma URL
  if (value.includes('http://') || value.includes('https://')) return false;
  
  // Não deve ser um número de telefone (55 + DDD + número)
  if (/^55\d{10,11}$/.test(value.replace(/\D/g, ''))) return false;
  
  // Não deve ser apenas números longos (IDs)
  if (/^\d{10,}$/.test(value)) return false;
  
  // Deve ter tamanho razoável (não muito longo)
  if (value.length > 100) return false;
  
  return true;
};

// Tipos separados para UTMs e dados customizados
export type UTMParameters = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

export type TrackingParameters = {
  gclid?: string;
  fbclid?: string;
  ttclid?: string;
  ctwa_clid?: string;
  source_id?: string;
  media_url?: string;
  ad_id?: string;
  facebook_ad_id?: string;
};

export type CollectedParameters = {
  utm: UTMParameters;
  tracking: TrackingParameters;
};

export const collectUrlParameters = (): CollectedParameters => {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm: UTMParameters = {};
    const tracking: TrackingParameters = {};
    
    // 📊 COLETAR APENAS UTMs VÁLIDOS
    const utmParams: (keyof UTMParameters)[] = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    utmParams.forEach(param => {
      const value = params.get(param);
      if (value && isValidUTMValue(value)) {
        utm[param] = value.trim();
        console.log(`✅ UTM válido coletado: ${param} = ${value}`);
      } else if (value) {
        console.warn(`⚠️ UTM inválido rejeitado: ${param} = ${value}`);
      }
    });
    
    // 🎯 COLETAR PARÂMETROS DE TRACKING (separados dos UTMs)
    
    // Google Ads click ID
    const gclid = params.get('gclid');
    if (gclid) {
      tracking.gclid = gclid;
      localStorage.setItem('_gclid', gclid);
    }
    
    // Facebook click ID  
    const fbclid = params.get('fbclid');
    if (fbclid) {
      tracking.fbclid = fbclid;
      localStorage.setItem('_fbclid', fbclid);
    }

    // TikTok click ID
    const ttclid = params.get('ttclid');
    if (ttclid) {
      tracking.ttclid = ttclid;
      localStorage.setItem('_ttclid', ttclid);
    }

    // META CLICK-TO-WHATSAPP ID
    const ctwaCLid = params.get('ctwa_clid');
    if (ctwaCLid) {
      tracking.ctwa_clid = ctwaCLid;
      localStorage.setItem('_ctwa_clid', ctwaCLid);
      console.log('🎯 [CTWA] Click-to-WhatsApp ID detectado:', ctwaCLid);
    }

    // Source ID personalizado
    const sourceId = params.get('source_id');
    if (sourceId) {
      tracking.source_id = sourceId;
      localStorage.setItem('_source_id', sourceId);
    }

    // URL de mídia
    const mediaUrl = params.get('media_url');
    if (mediaUrl) {
      tracking.media_url = mediaUrl;
      localStorage.setItem('_media_url', mediaUrl);
    }

    // Facebook Ad ID parameters
    const adId = params.get('ad_id');
    if (adId) {
      tracking.ad_id = adId;
      localStorage.setItem('_ad_id', adId);
    }

    const facebookAdId = params.get('facebook_ad_id');
    if (facebookAdId) {
      tracking.facebook_ad_id = facebookAdId;
      localStorage.setItem('_facebook_ad_id', facebookAdId);
    }

    // 💾 RECUPERAR PARÂMETROS PERSISTIDOS DO LOCALSTORAGE
    if (!tracking.gclid) {
      const stored = localStorage.getItem('_gclid');
      if (stored) tracking.gclid = stored;
    }

    if (!tracking.fbclid) {
      const stored = localStorage.getItem('_fbclid');
      if (stored) tracking.fbclid = stored;
    }

    if (!tracking.ttclid) {
      const stored = localStorage.getItem('_ttclid');
      if (stored) tracking.ttclid = stored;
    }

    if (!tracking.ctwa_clid) {
      const stored = localStorage.getItem('_ctwa_clid');
      if (stored) tracking.ctwa_clid = stored;
    }

    if (!tracking.source_id) {
      const stored = localStorage.getItem('_source_id');
      if (stored) tracking.source_id = stored;
    }

    if (!tracking.media_url) {
      const stored = localStorage.getItem('_media_url');
      if (stored) tracking.media_url = stored;
    }

    if (!tracking.ad_id) {
      const stored = localStorage.getItem('_ad_id');
      if (stored) tracking.ad_id = stored;
    }

    if (!tracking.facebook_ad_id) {
      const stored = localStorage.getItem('_facebook_ad_id');
      if (stored) tracking.facebook_ad_id = stored;
    }

    console.log('📊 [DATA COLLECTION] Parâmetros coletados e validados:', {
      utm_count: Object.keys(utm).length,
      tracking_count: Object.keys(tracking).length,
      utm_params: utm,
      tracking_params: Object.keys(tracking)
    });
    
    return { utm, tracking };
  } catch (error) {
    console.error('❌ [DATA COLLECTION] Erro ao coletar parâmetros da URL:', error);
    return { utm: {}, tracking: {} };
  }
};

