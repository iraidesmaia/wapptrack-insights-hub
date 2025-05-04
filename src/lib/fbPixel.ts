
// Facebook Pixel utility functions

declare global {
  interface Window {
    fbq: any;
    _fbq: any; // Add _fbq to the window interface
    fbPixelInitialized?: boolean; // Add a flag to track initialization
  }
}

/**
 * Initializes the Facebook Pixel with the given ID
 * @param pixelId The Facebook Pixel ID
 */
export const initFacebookPixel = (pixelId: string) => {
  if (!pixelId) return;
  
  // Check if the pixel is already initialized
  if (window.fbPixelInitialized) {
    console.log('Facebook Pixel already initialized');
    return;
  }
  
  try {
    // Initialize Facebook Pixel
    // Rewrite the IIFE to avoid testing a void expression for truthiness
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
      if (s && s.parentNode) { // Add null check
        s.parentNode.insertBefore(t, s);
      }
    };
    
    // Execute the function without the problematic truthiness check
    fbInitFunction(
      window,
      document,
      'script',
      'https://connect.facebook.net/en_US/fbevents.js'
    );
    
    window.fbq('init', pixelId);
    window.fbPixelInitialized = true;
    console.log('Facebook Pixel initialized with ID:', pixelId);
  } catch (error) {
    console.error('Error initializing Facebook Pixel:', error);
  }
};

/**
 * Tracks a PageView event
 */
export const trackPageView = () => {
  if (!window.fbq) return;
  try {
    window.fbq('track', 'PageView');
    console.log('Facebook Pixel PageView event tracked');
  } catch (error) {
    console.error('Error tracking PageView event:', error);
  }
};

/**
 * Tracks a Lead event
 * @param value Optional value of the lead
 * @param currency Optional currency code
 */
export const trackLead = (value?: number, currency: string = 'BRL') => {
  if (!window.fbq) return;
  try {
    const params = value ? { value, currency } : {};
    window.fbq('track', 'Lead', params);
    console.log('Facebook Pixel Lead event tracked', params);
  } catch (error) {
    console.error('Error tracking Lead event:', error);
  }
};

/**
 * Tracks a Contact event
 */
export const trackContact = () => {
  if (!window.fbq) return;
  try {
    window.fbq('track', 'Contact');
    console.log('Facebook Pixel Contact event tracked');
  } catch (error) {
    console.error('Error tracking Contact event:', error);
  }
};

/**
 * Tracks a Purchase event
 * @param value Value of the purchase
 * @param currency Currency code
 */
export const trackPurchase = (value: number, currency: string = 'BRL') => {
  if (!window.fbq) return;
  try {
    window.fbq('track', 'Purchase', { value, currency });
    console.log('Facebook Pixel Purchase event tracked', { value, currency });
  } catch (error) {
    console.error('Error tracking Purchase event:', error);
  }
};

/**
 * Tracks an event based on the specified event type
 * @param eventType The type of event to track
 * @param value Optional value for the event
 */
export const trackEventByType = (eventType: string, value?: number) => {
  switch (eventType) {
    case 'lead':
      trackLead(value);
      break;
    case 'contact':
      trackContact();
      break;
    case 'sale':
      trackPurchase(value || 0);
      break;
    case 'page_view':
      trackPageView();
      break;
    default:
      trackPageView();
  }
};
