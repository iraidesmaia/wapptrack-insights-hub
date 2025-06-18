// Comprehensive data collection utilities for maximum tracking
export interface UrlParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
  _fbc?: string;
  _fbp?: string;
  ref?: string;
  source?: string;
  campaign_id?: string;
  ad_id?: string;
  adset_id?: string;
  creative_id?: string;
  placement?: string;
  site_source_name?: string;
  facebook_ad_id?: string;
  facebook_adset_id?: string;
  facebook_campaign_id?: string;
}

export interface DeviceData {
  userAgent: string;
  platform: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  browserName: string;
  browserVersion: string;
  operatingSystem: string;
  screenResolution: string;
  screenWidth: number;
  screenHeight: number;
  windowWidth: number;
  windowHeight: number;
  colorDepth: number;
  pixelRatio: number;
  timezone: string;
  language: string;
  languages: string[];
  cookieEnabled: boolean;
  onlineStatus: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface SessionData {
  sessionId: string;
  visitorId: string;
  startTime: number;
  currentTime: number;
  timeOnPage: number;
  pageViews: number;
  scrollDepth: number;
  maxScrollDepth: number;
  clickCount: number;
  formInteractions: number;
  mouseMovements: number;
  keystrokes: number;
  idleTime: number;
  engagementScore: number;
}

export interface GeolocationData {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  ipAddress?: string;
}

export interface ContextData {
  referrer: string;
  sourceUrl: string;
  currentUrl: string;
  title: string;
  domain: string;
  path: string;
  hash: string;
  search: string;
  timestamp: number;
  loadTime: number;
  domReady: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

export interface FacebookData {
  fbc?: string;
  fbp?: string;
  fbclid?: string;
  eventId?: string;
  clickId?: string;
  browserId?: string;
  sessionId?: string;
  advancedMatchingData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    dateOfBirth?: string;
    gender?: string;
  };
}

// URL Parameter Collection
export const collectUrlParameters = (): UrlParameters => {
  const params = new URLSearchParams(window.location.search);
  const hash = window.location.hash.substring(1);
  const hashParams = new URLSearchParams(hash);
  
  const allParams = new URLSearchParams();
  params.forEach((value, key) => allParams.set(key, value));
  hashParams.forEach((value, key) => allParams.set(key, value));
  
  return {
    utm_source: allParams.get('utm_source') || undefined,
    utm_medium: allParams.get('utm_medium') || undefined,
    utm_campaign: allParams.get('utm_campaign') || undefined,
    utm_content: allParams.get('utm_content') || undefined,
    utm_term: allParams.get('utm_term') || undefined,
    fbclid: allParams.get('fbclid') || undefined,
    gclid: allParams.get('gclid') || undefined,
    ttclid: allParams.get('ttclid') || undefined,
    _fbc: allParams.get('_fbc') || localStorage.getItem('_fbc') || undefined,
    _fbp: allParams.get('_fbp') || localStorage.getItem('_fbp') || undefined,
    ref: allParams.get('ref') || undefined,
    source: allParams.get('source') || undefined,
    campaign_id: allParams.get('campaign_id') || undefined,
    ad_id: allParams.get('ad_id') || undefined,
    adset_id: allParams.get('adset_id') || undefined,
    creative_id: allParams.get('creative_id') || undefined,
    placement: allParams.get('placement') || undefined,
    site_source_name: allParams.get('site_source_name') || undefined,
    facebook_ad_id: allParams.get('facebook_ad_id') || undefined,
    facebook_adset_id: allParams.get('facebook_adset_id') || undefined,
    facebook_campaign_id: allParams.get('facebook_campaign_id') || undefined,
  };
};

// Device Data Collection
export const collectDeviceData = (): DeviceData => {
  const userAgent = navigator.userAgent;
  
  const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  const getBrowserInfo = () => {
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Safari\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge';
      const match = userAgent.match(/Edge\/(\d+)/);
      browserVersion = match ? match[1] : 'Unknown';
    }
    
    return { browserName, browserVersion };
  };

  const getOperatingSystem = (): string => {
    if (userAgent.includes('Windows NT 10.0')) return 'Windows 10';
    if (userAgent.includes('Windows NT 6.3')) return 'Windows 8.1';
    if (userAgent.includes('Windows NT 6.2')) return 'Windows 8';
    if (userAgent.includes('Windows NT 6.1')) return 'Windows 7';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS X')) {
      const match = userAgent.match(/Mac OS X (\d+[._]\d+)/);
      return match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
    }
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android (\d+[._]\d+)/);
      return match ? `Android ${match[1].replace('_', '.')}` : 'Android';
    }
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  };

  const getConnectionInfo = () => {
    // @ts-ignore - experimental API
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return {
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
    };
  };

  const { browserName, browserVersion } = getBrowserInfo();
  const connectionInfo = getConnectionInfo();

  return {
    userAgent,
    platform: navigator.platform,
    deviceType: getDeviceType(),
    browserName,
    browserVersion,
    operatingSystem: getOperatingSystem(),
    screenResolution: `${screen.width}x${screen.height}`,
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    languages: navigator.languages ? Array.from(navigator.languages) : [navigator.language],
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    connectionType: connectionInfo.connectionType,
    effectiveType: connectionInfo.effectiveType,
    downlink: connectionInfo.downlink,
    rtt: connectionInfo.rtt,
  };
};

// Session Data Collection
export const collectSessionData = (): SessionData => {
  const startTime = parseInt(sessionStorage.getItem('session_start_time') || Date.now().toString());
  const currentTime = Date.now();
  const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
  const visitorId = localStorage.getItem('visitor_id') || generateVisitorId();
  
  // Store session start time if not exists
  if (!sessionStorage.getItem('session_start_time')) {
    sessionStorage.setItem('session_start_time', startTime.toString());
  }

  const scrollDepth = Math.round((window.scrollY / Math.max(document.body.scrollHeight - window.innerHeight, 1)) * 100);
  const maxScrollDepth = Math.max(
    parseInt(sessionStorage.getItem('max_scroll_depth') || '0'),
    scrollDepth
  );
  sessionStorage.setItem('max_scroll_depth', maxScrollDepth.toString());

  const clickCount = parseInt(sessionStorage.getItem('click_count') || '0');
  const pageViews = parseInt(sessionStorage.getItem('page_views') || '1');
  const formInteractions = parseInt(sessionStorage.getItem('form_interactions') || '0');

  return {
    sessionId,
    visitorId,
    startTime,
    currentTime,
    timeOnPage: Math.round((currentTime - startTime) / 1000),
    pageViews,
    scrollDepth,
    maxScrollDepth,
    clickCount,
    formInteractions,
    mouseMovements: parseInt(sessionStorage.getItem('mouse_movements') || '0'),
    keystrokes: parseInt(sessionStorage.getItem('keystrokes') || '0'),
    idleTime: parseInt(sessionStorage.getItem('idle_time') || '0'),
    engagementScore: calculateEngagementScore(maxScrollDepth, clickCount, currentTime - startTime),
  };
};

// Context Data Collection
export const collectContextData = (): ContextData => {
  const loadTime = performance.timing ? 
    performance.timing.loadEventEnd - performance.timing.navigationStart : 0;
  const domReady = performance.timing ? 
    performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart : 0;

  // Performance metrics
  let perfMetrics = {};
  if ('getEntriesByType' in performance) {
    const paintEntries = performance.getEntriesByType('paint');
    const navigationEntries = performance.getEntriesByType('navigation');
    
    perfMetrics = {
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
    };
  }

  return {
    referrer: document.referrer,
    sourceUrl: window.location.href,
    currentUrl: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    path: window.location.pathname,
    hash: window.location.hash,
    search: window.location.search,
    timestamp: Date.now(),
    loadTime,
    domReady,
    ...perfMetrics,
  };
};

// Facebook Data Collection
export const collectFacebookData = (additionalData?: any): FacebookData => {
  // Get Facebook cookies/parameters
  const fbc = localStorage.getItem('_fbc') || getCookie('_fbc');
  const fbp = localStorage.getItem('_fbp') || getCookie('_fbp');
  const fbclid = new URLSearchParams(window.location.search).get('fbclid');
  
  // Store Facebook parameters in localStorage for persistence
  if (fbclid && !fbc) {
    const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
    localStorage.setItem('_fbc', fbcValue);
  }
  
  if (!fbp) {
    const fbpValue = `fb.1.${Date.now()}.${Math.random().toString(36).substring(2)}`;
    localStorage.setItem('_fbp', fbpValue);
  }

  return {
    fbc: fbc || undefined,
    fbp: fbp || localStorage.getItem('_fbp') || undefined,
    fbclid: fbclid || undefined,
    eventId: generateEventId(),
    clickId: fbclid || undefined,
    browserId: localStorage.getItem('_fbp') || undefined,
    sessionId: sessionStorage.getItem('session_id') || undefined,
    advancedMatchingData: additionalData || undefined,
  };
};

// Geolocation Data Collection
export const collectGeolocationData = (): Promise<GeolocationData> => {
  return new Promise((resolve) => {
    const defaultData: GeolocationData = {
      country: 'BR', // Default to Brazil
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    if (!navigator.geolocation) {
      resolve(defaultData);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ...defaultData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        resolve(defaultData);
      },
      { timeout: 5000, enableHighAccuracy: false }
    );
  });
};

// Nova função para integrar com o sistema de device_data
export const captureAndSaveDeviceData = async (phone?: string) => {
  try {
    console.log('📱 Capturando dados do dispositivo...');
    
    // Coletar todos os dados disponíveis
    const urlParams = collectUrlParameters();
    const deviceData = collectDeviceData();
    const sessionData = collectSessionData();
    const contextData = collectContextData();
    const facebookData = collectFacebookData();
    
    let locationData: GeolocationData = {
      country: 'Brasil',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    try {
      locationData = await collectGeolocationData();
    } catch (error) {
      console.warn('Não foi possível obter dados de geolocalização:', error);
    }

    // 🎯 PRIORIZAR PARÂMETROS CORRETOS (sem prefixo primeiro, depois com prefixo)
    const getFacebookAdId = () => urlParams.ad_id || urlParams.facebook_ad_id;
    const getFacebookAdsetId = () => urlParams.adset_id || urlParams.facebook_adset_id;
    const getFacebookCampaignId = () => urlParams.campaign_id || urlParams.facebook_campaign_id;

    // 🎯 INCLUIR TODOS OS PARÂMETROS NOS UTMs SALVOS
    const urlParamsString = [
      urlParams.utm_source ? `utm_source=${urlParams.utm_source}` : '',
      urlParams.utm_medium ? `utm_medium=${urlParams.utm_medium}` : '',
      urlParams.utm_campaign ? `utm_campaign=${urlParams.utm_campaign}` : '',
      urlParams.utm_content ? `utm_content=${urlParams.utm_content}` : '',
      urlParams.utm_term ? `utm_term=${urlParams.utm_term}` : '',
      urlParams.fbclid ? `fbclid=${urlParams.fbclid}` : '',
      urlParams.gclid ? `gclid=${urlParams.gclid}` : '',
      getFacebookAdId() ? `ad_id=${getFacebookAdId()}` : '',
      getFacebookAdsetId() ? `adset_id=${getFacebookAdsetId()}` : '',
      getFacebookCampaignId() ? `campaign_id=${getFacebookCampaignId()}` : '',
    ].filter(Boolean).join(', ');

    // Montar objeto completo para salvar
    const completeDeviceData = {
      phone,
      ip_address: 'Detectando...', // Será obtido via API externa
      user_agent: deviceData.userAgent,
      browser: deviceData.browserName,
      os: deviceData.operatingSystem,
      device_type: deviceData.deviceType,
      device_model: deviceData.deviceType, // Usar como modelo básico
      location: locationData.country ? `${locationData.city || 'N/A'}, ${locationData.country}` : 'Não disponível',
      country: locationData.country || 'Brasil',
      city: locationData.city || 'Não disponível',
      referrer: contextData.referrer,
      screen_resolution: deviceData.screenResolution,
      timezone: deviceData.timezone,
      language: deviceData.language,
      utm_source: urlParams.utm_source,
      utm_medium: urlParams.utm_medium,
      utm_campaign: urlParams.utm_campaign,
      utm_content: urlParams.utm_content || (urlParams.gclid ? `gclid=${urlParams.gclid}` : undefined),
      utm_term: urlParams.utm_term || (urlParams.fbclid ? `fbclid=${urlParams.fbclid}` : undefined),
      // 🎯 INCLUIR PARÂMETROS DO FACEBOOK ADS (PRIORIZANDO FORMATO CORRETO)
      facebook_ad_id: getFacebookAdId(),
      facebook_adset_id: getFacebookAdsetId(),
      facebook_campaign_id: getFacebookCampaignId()
    };

    console.log('📱 Dados do dispositivo coletados com parâmetros Facebook (ambos formatos):', {
      ad_id: getFacebookAdId(),
      facebook_ad_id: urlParams.facebook_ad_id,
      adset_id: getFacebookAdsetId(),
      facebook_adset_id: urlParams.facebook_adset_id,
      campaign_id: getFacebookCampaignId(),
      facebook_campaign_id: urlParams.facebook_campaign_id,
      phone: completeDeviceData.phone
    });
    
    // Importar dinamicamente o serviço para evitar circular dependency
    const { saveDeviceData } = await import('@/services/deviceDataService');
    
    try {
      const result = await saveDeviceData(completeDeviceData);
      console.log('✅ Dados do dispositivo salvos com sucesso:', result);
    } catch (error) {
      console.error('❌ Erro ao salvar dados do dispositivo:', error);
    }
    
    return completeDeviceData;
  } catch (error) {
    console.error('❌ Erro ao capturar e salvar dados do dispositivo:', error);
    return null;
  }
};

// Utility functions
export const generateSessionId = (): string => {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  sessionStorage.setItem('session_id', sessionId);
  return sessionId;
};

export const generateVisitorId = (): string => {
  const visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  localStorage.setItem('visitor_id', visitorId);
  return visitorId;
};

export const generateEventId = (): string => {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

const calculateEngagementScore = (scrollDepth: number, clicks: number, timeOnPage: number): number => {
  let score = 0;
  
  // Scroll depth score (0-30 points)
  score += Math.min(scrollDepth * 0.3, 30);
  
  // Click score (0-25 points)
  score += Math.min(clicks * 5, 25);
  
  // Time on page score (0-45 points)
  const timeMinutes = timeOnPage / 60000;
  if (timeMinutes > 5) score += 45;
  else if (timeMinutes > 2) score += 30;
  else if (timeMinutes > 1) score += 20;
  else if (timeMinutes > 0.5) score += 10;
  
  return Math.round(Math.min(score, 100));
};

// Initialize event listeners for tracking
export const initializeEventTracking = () => {
  let clickCount = parseInt(sessionStorage.getItem('click_count') || '0');
  let mouseMovements = parseInt(sessionStorage.getItem('mouse_movements') || '0');
  let keystrokes = parseInt(sessionStorage.getItem('keystrokes') || '0');

  // Track clicks
  document.addEventListener('click', () => {
    clickCount++;
    sessionStorage.setItem('click_count', clickCount.toString());
  });

  // Track mouse movements (throttled)
  let mouseMoveThrottle: NodeJS.Timeout;
  document.addEventListener('mousemove', () => {
    if (mouseMoveThrottle) return;
    mouseMoveThrottle = setTimeout(() => {
      mouseMovements++;
      sessionStorage.setItem('mouse_movements', mouseMovements.toString());
      mouseMoveThrottle = null as any;
    }, 100);
  });

  // Track keystrokes
  document.addEventListener('keydown', () => {
    keystrokes++;
    sessionStorage.setItem('keystrokes', keystrokes.toString());
  });

  // Track form interactions
  document.addEventListener('focus', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      let formInteractions = parseInt(sessionStorage.getItem('form_interactions') || '0');
      formInteractions++;
      sessionStorage.setItem('form_interactions', formInteractions.toString());
    }
  }, true);

  // Update page views
  let pageViews = parseInt(sessionStorage.getItem('page_views') || '0');
  pageViews++;
  sessionStorage.setItem('page_views', pageViews.toString());
};
