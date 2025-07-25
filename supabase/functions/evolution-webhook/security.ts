
// Security utilities for webhook validation and sanitization

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

// Enhanced rate limiting with database persistence
export async function checkRateLimit(identifier: string, maxRequests = 50, windowMinutes = 60): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    // Import supabase client within function to avoid issues
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.0');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Call the database function for rate limiting
    const { data, error } = await supabase.rpc('check_rate_limit_db', {
      identifier_param: identifier,
      max_requests: maxRequests,
      window_minutes: windowMinutes
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      logSecurityEvent('Rate limit check failed', { identifier, error: error.message }, 'medium');
      // Fail open for now to avoid breaking functionality
      return { allowed: true };
    }
    
    const result = data as { allowed: boolean; retry_after?: number; reason?: string };
    
    if (!result.allowed) {
      logSecurityEvent('Rate limit exceeded', { 
        identifier, 
        reason: result.reason,
        retry_after: result.retry_after 
      }, 'high');
    }
    
    return { 
      allowed: result.allowed, 
      retryAfter: result.retry_after 
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    logSecurityEvent('Rate limiting system error', { identifier, error: error.message }, 'high');
    // Fail open to avoid breaking functionality
    return { allowed: true };
  }
}

export function sanitizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    throw new Error('Invalid phone number format');
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Basic validation - phone should be between 10-15 digits
  if (cleaned.length < 10 || cleaned.length > 15) {
    throw new Error('Phone number length invalid');
  }
  
  // Check for suspicious patterns
  if (/^0+$/.test(cleaned) || /^1+$/.test(cleaned)) {
    throw new Error('Suspicious phone number pattern');
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
  
  // Remove potential HTML/script tags
  const sanitized = content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
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
