
/**
 * Formats a Brazilian phone number for display
 * @param phone - Phone number with DDD (area code) only
 * @returns Formatted phone number like (85) 99999-9999
 */
export function formatBrazilianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Apply Brazilian format based on length
  if (digits.length <= 2) {
    return `(${digits}`;
  } else if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else {
    // Limit to 11 digits (DDD + 9 digits)
    const limited = digits.slice(0, 11);
    return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7)}`;
  }
}

/**
 * Processes a Brazilian phone number by adding the Brazil country code (55)
 * @param phone - Phone number with DDD only
 * @returns Phone number with Brazil country code (55)
 */
export function processBrazilianPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Add Brazil country code (55) if not present
  if (digits.startsWith('55')) {
    return digits;
  }
  
  return `55${digits}`;
}

/**
 * Validates Brazilian phone number format
 * @param phone - Phone number to validate
 * @returns true if valid Brazilian phone format
 */
export function validateBrazilianPhone(phone: string): boolean {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  
  // Should have exactly 11 digits (DDD + 9 digits)
  // DDD: 2 digits (11-99)
  // Phone: 9 digits (9xxxx-xxxx format)
  if (digits.length !== 11) return false;
  
  const ddd = parseInt(digits.slice(0, 2));
  const firstDigit = parseInt(digits.charAt(2));
  
  // Validate DDD (Brazilian area codes)
  if (ddd < 11 || ddd > 99) return false;
  
  // Mobile numbers should start with 9
  if (firstDigit !== 9) return false;
  
  return true;
}

/**
 * Formats phone number for display with country code
 * @param phone - Phone number with country code
 * @returns Formatted phone number like +55 (85) 99999-9999
 */
export function formatPhoneWithCountryCode(phone: string): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('55') && digits.length === 13) {
    const ddd = digits.slice(2, 4);
    const number = digits.slice(4);
    return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  }
  
  return phone;
}
