
// Facebook Pixel utility functions with optimized parameters

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    fbPixelInitialized?: boolean;
    fbDebug?: boolean;
  }
}

// SHA-256 hash function for personal data (LGPD compliance)
const hashData = async (data: string): Promise<string> => {
  if (!data) return '';
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Normalize phone number for Facebook
const normalizePhone = (phone: string): string => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('85') && normalized.length === 11) {
    normalized = '55' + normalized;
  } else if (!normalized.startsWith('55') && normalized.length === 11) {
    normalized = '55' + normalized;
  }
  return normalized;
};

/**
 * Initializes the Facebook Pixel with the given ID
 * @param pixelId The Facebook Pixel ID
 * @param debug Whether to display debug information
 */
export const initFacebookPixel = (pixelId?: string, debug: boolean = false) => {
  if (!pixelId) {
    console.warn('Facebook Pixel initialization failed: No Pixel ID provided');
    return false;
  }
  
  const cleanPixelId = pixelId.trim();
  
  if (cleanPixelId === '') {
    console.warn('Facebook Pixel initialization failed: Empty Pixel ID after trimming');
    return false;
  }

  window.fbDebug = debug;
  
  if (window.fbPixelInitialized) {
    if (debug) console.log('Facebook Pixel already initialized with ID:', cleanPixelId);
    return true;
  }
  
  try {
    const fbInitFunction = function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n; 
      n.push = n;
      n.loaded = !0;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = !0;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      if (s && s.parentNode) {
        s.parentNode.insertBefore(t, s);
      }
    };
    
    fbInitFunction(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js',
      null,
      null,
      null
    );
    
    window.fbq('init', cleanPixelId);
    window.fbPixelInitialized = true;
    
    if (debug) {
      console.log('Facebook Pixel initialized with ID:', cleanPixelId);
      const debugDiv = document.createElement('div');
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugDiv.style.color = '#fff';
      debugDiv.style.padding = '5px 10px';
      debugDiv.style.borderRadius = '5px';
      debugDiv.style.fontSize = '12px';
      debugDiv.style.zIndex = '9999';
      debugDiv.id = 'fb-pixel-debug';
      debugDiv.innerHTML = `FB Pixel: ${cleanPixelId} initialized`;
      document.body.appendChild(debugDiv);
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing Facebook Pixel:', error);
    return false;
  }
};

/**
 * Tracks an optimized PageView event with Facebook recommended parameters
 */
export const trackOptimizedPageView = (campaignName?: string, contentCategory?: string) => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track PageView.');
    return false;
  }
  
  try {
    const pageViewData = {
      content_name: campaignName || document.title,
      content_category: contentCategory || 'marketing',
      referrer: document.referrer,
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title
    };

    window.fbq('track', 'PageView', pageViewData);
    
    if (window.fbDebug) {
      console.log('Facebook Pixel Optimized PageView tracked:', pageViewData);
      updateDebugDiv('PageView tracked', pageViewData);
    }
    return true;
  } catch (error) {
    console.error('Error tracking optimized PageView event:', error);
    return false;
  }
};

/**
 * Tracks an optimized Lead event with Facebook recommended parameters and Advanced Matching
 */
export const trackOptimizedLead = async (leadData: {
  name?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  value?: number;
  campaignName?: string;
  contentCategory?: string;
}) => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Lead.');
    return false;
  }
  
  try {
    // Build custom data with Facebook recommended parameters
    const customData = {
      value: leadData.value || 100,
      currency: 'BRL',
      content_name: leadData.campaignName || 'Formulário Lead',
      content_category: leadData.contentCategory || 'contato',
      page_location: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: document.referrer
    };

    // Build Advanced Matching data (hashed)
    const advancedMatching: any = {};
    
    if (leadData.name) {
      const nameParts = leadData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      if (firstName) advancedMatching.fn = await hashData(firstName);
      if (lastName) advancedMatching.ln = await hashData(lastName);
    }
    
    if (leadData.email) {
      advancedMatching.em = await hashData(leadData.email);
    }
    
    if (leadData.phone) {
      const normalizedPhone = normalizePhone(leadData.phone);
      advancedMatching.ph = await hashData(normalizedPhone);
    }
    
    if (leadData.city) {
      advancedMatching.ct = await hashData(leadData.city);
    }
    
    if (leadData.state) {
      advancedMatching.st = await hashData(leadData.state);
    }
    
    // Always include country
    advancedMatching.country = await hashData('br');

    // Track with both custom data and advanced matching
    window.fbq('track', 'Lead', customData, { eventID: `lead_${Date.now()}` });
    
    // Track advanced matching separately if we have personal data
    if (Object.keys(advancedMatching).length > 1) { // more than just country
      window.fbq('track', 'Lead', customData, advancedMatching);
    }
    
    if (window.fbDebug) {
      console.log('Facebook Pixel Optimized Lead tracked:', {
        customData,
        advancedMatching: { ...advancedMatching, em: advancedMatching.em ? '[HASHED]' : undefined, ph: advancedMatching.ph ? '[HASHED]' : undefined }
      });
      updateDebugDiv('Lead tracked', customData);
    }
    
    return true;
  } catch (error) {
    console.error('Error tracking optimized Lead event:', error);
    return false;
  }
};

/**
 * Tracks a Contact event
 */
export const trackContact = () => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Contact.');
    return false;
  }
  
  try {
    window.fbq('track', 'Contact');
    if (window.fbDebug) {
      console.log('Facebook Pixel Contact event tracked');
      updateDebugDiv('Contact tracked');
    }
    return true;
  } catch (error) {
    console.error('Error tracking Contact event:', error);
    return false;
  }
};

/**
 * Tracks a Purchase event
 */
export const trackPurchase = (value: number, currency: string = 'BRL') => {
  if (!window.fbq) {
    console.warn('Facebook Pixel not initialized. Cannot track Purchase.');
    return false;
  }
  
  try {
    window.fbq('track', 'Purchase', { value, currency });
    if (window.fbDebug) {
      console.log('Facebook Pixel Purchase event tracked', { value, currency });
      updateDebugDiv('Purchase tracked', { value, currency });
    }
    return true;
  } catch (error) {
    console.error('Error tracking Purchase event:', error);
    return false;
  }
};

/**
 * Tracks an event based on the specified event type using optimized parameters
 */
export const trackOptimizedEventByType = async (
  eventType?: string, 
  campaignName?: string,
  leadData?: {
    name?: string;
    phone?: string;
    email?: string;
    city?: string;
    state?: string;
    value?: number;
  }
): Promise<boolean> => {
  if (!eventType) {
    console.warn('No event type specified for tracking');
    return false;
  }
  
  switch (eventType) {
    case 'lead':
    case 'contact':
      return await trackOptimizedLead({
        ...leadData,
        campaignName,
        contentCategory: 'contato'
      });
    case 'sale':
    case 'purchase':
      return trackPurchase(leadData?.value || 0);
    case 'page_view':
      return trackOptimizedPageView(campaignName, 'marketing');
    default:
      console.warn(`Unknown event type: ${eventType}, defaulting to optimized PageView`);
      return trackOptimizedPageView(campaignName, 'marketing');
  }
};

// Legacy functions for backward compatibility
export const trackPageView = () => trackOptimizedPageView();
export const trackLead = (value?: number, currency: string = 'BRL') => 
  trackOptimizedLead({ value, campaignName: 'Legacy Lead' });
export const trackEventByType = (eventType?: string, value?: number) => 
  trackOptimizedEventByType(eventType, 'Legacy Campaign', { value });

/**
 * Helper function to update the debug div with event information
 */
const updateDebugDiv = (eventName: string, params?: Record<string, any>) => {
  const debugDiv = document.getElementById('fb-pixel-debug');
  if (debugDiv) {
    const now = new Date();
    const timestamp = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    const paramsText = params ? ` ${JSON.stringify(params)}` : '';
    debugDiv.innerHTML = `${timestamp} - ${eventName}${paramsText}`;
  }
};

/**
 * Toggles debug mode for Facebook Pixel
 */
export const togglePixelDebug = (enabled: boolean) => {
  window.fbDebug = enabled;
  
  if (enabled) {
    if (!document.getElementById('fb-pixel-debug')) {
      const debugDiv = document.createElement('div');
      debugDiv.style.position = 'fixed';
      debugDiv.style.bottom = '10px';
      debugDiv.style.right = '10px';
      debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugDiv.style.color = '#fff';
      debugDiv.style.padding = '5px 10px';
      debugDiv.style.borderRadius = '5px';
      debugDiv.style.fontSize = '12px';
      debugDiv.style.zIndex = '9999';
      debugDiv.id = 'fb-pixel-debug';
      debugDiv.innerHTML = 'FB Pixel Debug Mode';
      document.body.appendChild(debugDiv);
    }
  } else {
    const debugDiv = document.getElementById('fb-pixel-debug');
    if (debugDiv) {
      debugDiv.remove();
    }
  }
  
  return enabled;
};
