import { sanitizeInput, validatePhone, validateEmail } from './validation';

// Enhanced security validation with comprehensive XSS protection
export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*>/gi, '')
    .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, 1000); // Limit length
};

// Rate limiting for form submissions (Enhanced security implementation)
const submissionTracker = new Map<string, { count: number; lastReset: number; violations: number }>();

export const checkFormRateLimit = (identifier: string, maxAttempts = 5, windowMs = 300000): boolean => {
  const now = Date.now();
  const key = `form_${identifier}`;
  const record = submissionTracker.get(key);
  
  if (!record || now - record.lastReset > windowMs) {
    submissionTracker.set(key, { count: 1, lastReset: now, violations: 0 });
    return true;
  }
  
  if (record.count >= maxAttempts) {
    record.violations++;
    logSecurityEvent('Form rate limit exceeded', { 
      identifier, 
      violations: record.violations,
      maxAttempts 
    }, 'high');
    return false;
  }
  
  record.count++;
  return true;
};

// Enhanced form data validation
export const validateFormData = (data: any): { isValid: boolean; errors: string[]; sanitizedData?: any } => {
  const errors: string[] = [];
  const sanitizedData: any = {};
  
  // Validate and sanitize common fields
  if (data.name) {
    const sanitizedName = sanitizeHtml(data.name);
    if (sanitizedName.length < 2 || sanitizedName.length > 100) {
      errors.push('Nome deve ter entre 2 e 100 caracteres');
    } else {
      sanitizedData.name = sanitizedName;
    }
  }
  
  if (data.phone) {
    const phoneValidation = validatePhone(data.phone);
    if (!phoneValidation.isValid) {
      errors.push(phoneValidation.error!);
    } else {
      sanitizedData.phone = phoneValidation.sanitized;
    }
  }
  
  if (data.email) {
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error!);
    } else {
      sanitizedData.email = sanitizeHtml(data.email);
    }
  }
  
  // Sanitize custom message
  if (data.custom_message) {
    sanitizedData.custom_message = sanitizeHtml(data.custom_message);
  }
  
  // Sanitize company fields
  if (data.company_title) {
    sanitizedData.company_title = sanitizeHtml(data.company_title);
  }
  
  if (data.company_subtitle) {
    sanitizedData.company_subtitle = sanitizeHtml(data.company_subtitle);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
};

// Security headers for responses
export const getSecurityHeaders = (): Record<string, string> => ({
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; frame-ancestors 'none';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
});

// Validate token format (basic check for Facebook tokens)
export const validateTokenFormat = (token: string, type: 'facebook'): boolean => {
  if (!token || typeof token !== 'string') return false;
  
  switch (type) {
    case 'facebook':
      // Basic Facebook token format validation
      return /^[A-Za-z0-9_-]{50,500}$/.test(token);
    default:
      return false;
  }
};

// Log security events with structured format
export const logSecurityEvent = (event: string, details: any, severity: 'low' | 'medium' | 'high' = 'medium') => {
  const timestamp = new Date().toISOString();
  console.log(`🔒 [SECURITY-${severity.toUpperCase()}] ${timestamp}: ${event}`, {
    event,
    severity,
    timestamp,
    details: typeof details === 'object' ? JSON.stringify(details) : details,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  });
};