// Função para coletar parâmetros UTM da URL atual
export const collectUrlParameters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_content: urlParams.get('utm_content') || undefined,
    utm_term: urlParams.get('utm_term') || undefined,
    fbclid: urlParams.get('fbclid') || undefined,
    gclid: urlParams.get('gclid') || undefined,
    ttclid: urlParams.get('ttclid') || undefined
  };
};

// Função para coletar dados da URL para tracking
export const collectTrackingData = () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    utm_source: urlParams.get('utm_source'),
    utm_medium: urlParams.get('utm_medium'), 
    utm_campaign: urlParams.get('utm_campaign'),
    utm_content: urlParams.get('utm_content'),
    utm_term: urlParams.get('utm_term'),
    gclid: urlParams.get('gclid'),
    fbclid: urlParams.get('fbclid'),
    referrer: document.referrer
  };
};

// Tipos para tracking avançado
export interface UrlParameters {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  ttclid?: string;
}

export interface DeviceData {
  userAgent: string;
  deviceType: string;
  browserName: string;
  operatingSystem: string;
  screenResolution: string;
  language: string;
  timezone: string;
}

export interface SessionData {
  sessionId: string;
  visitorId: string;
  timeOnPage: number;
  scrollDepth: number;
  pageViews: number;
  engagementScore: number;
  clickCount: number;
}

export interface ContextData {
  currentUrl: string;
  sourceUrl: string;
  referrer: string;
  title: string;
  path: string;
  loadTime: number;
}

export interface FacebookData {
  fbc?: string;
  fbp?: string;
  advancedMatchingData?: Record<string, any>;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  city: string;
  ipAddress: string;
}

// Implementações das funções
export const collectDeviceData = (): DeviceData => {
  const userAgent = navigator.userAgent;
  
  return {
    userAgent,
    deviceType: /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop',
    browserName: getBrowserName(userAgent),
    operatingSystem: getOperatingSystem(userAgent),
    screenResolution: `${screen.width}x${screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

export const collectSessionData = (): SessionData => {
  const sessionId = sessionStorage.getItem('session_id') || generateSessionId();
  const visitorId = localStorage.getItem('visitor_id') || generateVisitorId();
  
  if (!sessionStorage.getItem('session_id')) {
    sessionStorage.setItem('session_id', sessionId);
  }
  if (!localStorage.getItem('visitor_id')) {
    localStorage.setItem('visitor_id', visitorId);
  }
  
  // Use modern performance.now() instead of deprecated navigationStart
  const pageLoadTime = performance.now();
  
  return {
    sessionId,
    visitorId,
    timeOnPage: pageLoadTime,
    scrollDepth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0,
    pageViews: parseInt(sessionStorage.getItem('page_views') || '1'),
    engagementScore: calculateEngagementScore(),
    clickCount: parseInt(sessionStorage.getItem('click_count') || '0')
  };
};

export const collectContextData = (): ContextData => {
  // Use modern performance timing API
  const loadTime = performance.now();
  
  return {
    currentUrl: window.location.href,
    sourceUrl: document.referrer,
    referrer: document.referrer,
    title: document.title,
    path: window.location.pathname,
    loadTime
  };
};

export const collectFacebookData = (): FacebookData => {
  const fbc = getCookie('_fbc');
  const fbp = getCookie('_fbp');
  
  return {
    fbc,
    fbp,
    advancedMatchingData: {}
  };
};

export const collectGeolocationData = (): Promise<GeolocationData> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          country: '',
          region: '',
          city: '',
          ipAddress: ''
        });
      },
      (error) => reject(error)
    );
  });
};

export const initializeEventTracking = () => {
  // Incrementar page views
  const pageViews = parseInt(sessionStorage.getItem('page_views') || '0') + 1;
  sessionStorage.setItem('page_views', pageViews.toString());
  
  // Track clicks
  document.addEventListener('click', () => {
    const clickCount = parseInt(sessionStorage.getItem('click_count') || '0') + 1;
    sessionStorage.setItem('click_count', clickCount.toString());
  });
};

// Funções auxiliares
function getBrowserName(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Unknown';
}

function getOperatingSystem(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
}

function generateSessionId(): string {
  return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function generateVisitorId(): string {
  return 'vis_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function calculateEngagementScore(): number {
  const timeOnPage = performance.now();
  const scrollDepth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0;
  const clickCount = parseInt(sessionStorage.getItem('click_count') || '0');
  
  return Math.min(100, Math.round((timeOnPage / 1000) * 0.1 + scrollDepth * 0.5 + clickCount * 10));
}

function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift();
  }
  return undefined;
}
