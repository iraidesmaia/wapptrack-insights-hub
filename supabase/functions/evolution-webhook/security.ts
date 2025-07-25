
// Security utilities for webhook validation and sanitization

// Environment-based CORS configuration
const isDevelopment = Deno.env.get('ENVIRONMENT') === 'development';
const allowedOrigins = isDevelopment 
  ? ['http://localhost:5173', 'http://localhost:3000', 'https://gbrpboxxhlwmenrajdji.lovableproject.com']
  : ['https://gbrpboxxhlwmenrajdji.lovableproject.com', 'https://your-production-domain.com'];

export const corsHeaders = {
  'Access-Control-Allow-Origin': isDevelopment ? '*' : allowedOrigins[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Database-backed rate limiting function
export async function checkRateLimit(supabase: any, identifier: string, maxRequests = 100, windowMinutes = 60): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit_db', {
      identifier_param: identifier,
      max_requests: maxRequests,
      window_minutes: windowMinutes
    });
    
    if (error) {
      console.error('Rate limit check error:', error);
      // Fail closed - if we can't check rate limit, deny the request
      return false;
    }
    
    return data === true;
  } catch (error) {
    console.error('Rate limit check exception:', error);
    // Fail closed
    return false;
  }
}

// Fallback in-memory rate limiting for cases where DB is unavailable
const fallbackRateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimitFallback(identifier: string, maxRequests = 50, windowMs = 60000): boolean {
  const now = Date.now();
  const record = fallbackRateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    fallbackRateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone number format');
  }
  
  // Check for SQL injection attempts and script injections
  if (phone.includes("'") || phone.includes('"') || phone.includes('<') || phone.includes('>') || 
      phone.includes('script') || phone.includes('javascript:') || phone.includes('data:') ||
      phone.includes('SELECT') || phone.includes('INSERT') || phone.includes('DELETE') ||
      phone.includes('UPDATE') || phone.includes('DROP')) {
    throw new Error('Invalid characters in phone number');
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Enhanced validation - phone should be between 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Phone number length invalid');
  }
  
  // Check for suspicious patterns (all same digits, sequential patterns)
  if (/^(\d)\1{9,}$/.test(cleaned) || /^0+$/.test(cleaned) || /^1+$/.test(cleaned) ||
      /^123456789/.test(cleaned) || /^987654321/.test(cleaned)) {
    throw new Error('Suspicious phone number pattern detected');
  }
  
  // Check for valid Brazilian phone patterns if starts with 55
  if (cleaned.startsWith('55') && cleaned.length >= 12) {
    const withoutCountryCode = cleaned.slice(2);
    const ddd = parseInt(withoutCountryCode.slice(0, 2));
    
    // Valid Brazilian DDDs
    const validDDDs = [
      11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64, 65, 66, 67, 68, 69,
      71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94, 95, 96, 97, 98, 99
    ];
    
    if (!validDDDs.includes(ddd)) {
      throw new Error('Invalid Brazilian DDD');
    }
  }
  
  return cleaned;
}

export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Limit message length to prevent abuse
  if (content.length > 5000) {
    content = content.substring(0, 5000) + '...';
  }
  
  // Remove potential HTML/script tags and suspicious content
  let sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVED]')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '[IFRAME_REMOVED]')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '[OBJECT_REMOVED]')
    .replace(/<embed\b[^<]*>/gi, '[EMBED_REMOVED]')
    .replace(/<link\b[^<]*>/gi, '[LINK_REMOVED]')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '[STYLE_REMOVED]')
    .replace(/javascript:/gi, 'javascript-blocked:')
    .replace(/data:(?!image\/)/gi, 'data-blocked:')
    .replace(/vbscript:/gi, 'vbscript-blocked:')
    .replace(/on\w+\s*=/gi, 'event-blocked=')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  // Additional SQL injection prevention
  sanitized = sanitized
    .replace(/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/gi, '[SQL_BLOCKED]')
    .replace(/(\bUNION\b|\bOR\b\s+\d+\s*=\s*\d+|\bAND\b\s+\d+\s*=\s*\d+)/gi, '[INJECTION_BLOCKED]');
  
  return sanitized;
}

export function sanitizeInstanceName(instanceName: string): string {
  if (!instanceName || typeof instanceName !== 'string') {
    throw new Error('Invalid instance name');
  }
  
  // Allow only alphanumeric characters, hyphens, and underscores
  const sanitized = instanceName.replace(/[^a-zA-Z0-9_-]/g, '');
  
  if (sanitized.length === 0 || sanitized.length > 100) {
    throw new Error('Instance name invalid format');
  }
  
  return sanitized;
}

export function logSecurityEvent(event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [SECURITY-${severity.toUpperCase()}] ${timestamp}: ${event}`, {
    ...details,
    severity,
    timestamp
  });
}

export function validateWebhookPayload(body: any): boolean {
  if (!body || typeof body !== 'object') {
    logSecurityEvent('Invalid webhook payload format', { body }, 'high');
    return false;
  }
  
  if (!body.event || !body.instance) {
    logSecurityEvent('Missing required webhook fields', { body }, 'medium');
    return false;
  }
  
  return true;
}
