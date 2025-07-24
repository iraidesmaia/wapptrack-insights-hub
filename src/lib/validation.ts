// Input validation utilities for enhanced security

export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potential XSS patterns and limit length
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .slice(0, maxLength);
};

export const validatePhone = (phone: string): { isValid: boolean; sanitized: string; error?: string } => {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, sanitized: '', error: 'Telefone é obrigatório' };
  }
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Validate length
  if (cleaned.length < 10 || cleaned.length > 15) {
    return { 
      isValid: false, 
      sanitized: cleaned, 
      error: 'Telefone deve ter entre 10 e 15 dígitos' 
    };
  }
  
  // Check for suspicious patterns
  if (/^0+$/.test(cleaned) || /^1+$/.test(cleaned)) {
    return { 
      isValid: false, 
      sanitized: cleaned, 
      error: 'Formato de telefone inválido' 
    };
  }
  
  return { isValid: true, sanitized: cleaned };
};

export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return { isValid: true };
};

export const validateUrl = (url: string): { isValid: boolean; error?: string } => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL é obrigatória' };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Formato de URL inválido' };
  }
};

export const validateRequired = (value: string, fieldName: string): { isValid: boolean; error?: string } => {
  if (!value || typeof value !== 'string' || !value.trim()) {
    return { isValid: false, error: `${fieldName} é obrigatório` };
  }
  
  return { isValid: true };
};

export const sanitizeFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

export const validateCampaignData = (campaign: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const nameValidation = validateRequired(campaign.name, 'Nome da campanha');
  if (!nameValidation.isValid) errors.push(nameValidation.error!);
  
  // Optional but important validations
  if (campaign.whatsapp_number) {
    const phoneValidation = validatePhone(campaign.whatsapp_number);
    if (!phoneValidation.isValid) errors.push(phoneValidation.error!);
  }
  
  if (campaign.pixel_id && (typeof campaign.pixel_id !== 'string' || campaign.pixel_id.length < 10)) {
    errors.push('ID do Pixel deve ter pelo menos 10 caracteres');
  }
  
  return { isValid: errors.length === 0, errors };
};

export const validateLeadData = (lead: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Required fields validation
  const nameValidation = validateRequired(lead.name, 'Nome');
  if (!nameValidation.isValid) errors.push(nameValidation.error!);
  
  const campaignValidation = validateRequired(lead.campaign, 'Campanha');
  if (!campaignValidation.isValid) errors.push(campaignValidation.error!);
  
  const phoneValidation = validatePhone(lead.phone);
  if (!phoneValidation.isValid) errors.push(phoneValidation.error!);
  
  return { isValid: errors.length === 0, errors };
};