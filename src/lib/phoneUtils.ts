
/**
 * Formats a Brazilian phone number for display
 * @param phone - Phone number with DDD (area code) only
 * @returns Formatted phone number like (85) 99999-9999 or (85) 9999-9999
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
  } else if (digits.length <= 10) {
    // 8 digits after DDD: (85) 9999-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else if (digits.length <= 11) {
    // 9 digits after DDD: (85) 99999-9999
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  } else {
    // Limit to 11 digits maximum
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
  
  // Just add country code - don't modify the number itself
  return `55${digits}`;
}

/**
 * Validates Brazilian phone number format with enhanced security
 * @param phone - Phone number to validate
 * @returns true if valid Brazilian phone format
 */
export function validateBrazilianPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  
  // Block suspicious patterns and potential injection attempts
  if (phone.includes('<script>') || phone.includes('javascript:') || phone.includes('data:')) {
    return false;
  }
  
  const digits = phone.replace(/\D/g, '');
  
  // Should have 10 or 11 digits (DDD + 8 or 9 digits)
  // DDD: 2 digits (11-99)
  // Phone: 8 digits (old format) or 9 digits (mobile with 9)
  if (digits.length !== 10 && digits.length !== 11) return false;
  
  // Block suspicious patterns (all same digit, etc.)
  if (/^(\d)\1{9,}$/.test(digits)) return false;
  
  const ddd = parseInt(digits.slice(0, 2));
  
  // Validate DDD (Brazilian area codes) - enhanced with more comprehensive validation
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // São Paulo
    21, 22, 24, // Rio de Janeiro
    27, 28, // Espírito Santo
    31, 32, 33, 34, 35, 37, 38, // Minas Gerais
    41, 42, 43, 44, 45, 46, // Paraná
    47, 48, 49, // Santa Catarina
    51, 53, 54, 55, // Rio Grande do Sul
    61, // Distrito Federal
    62, 64, // Goiás
    63, // Tocantins
    65, 66, // Mato Grosso
    67, // Mato Grosso do Sul
    68, // Acre
    69, // Rondônia
    71, 73, 74, 75, 77, // Bahia
    79, // Sergipe
    81, 87, // Pernambuco
    82, // Alagoas
    83, // Paraíba
    84, // Rio Grande do Norte
    85, 88, // Ceará
    86, 89, // Piauí
    91, 93, 94, // Pará
    92, 97, // Amazonas
    95, // Roraima
    96, // Amapá
    98, 99 // Maranhão
  ];
  
  if (!validDDDs.includes(ddd)) return false;
  
  // For 11 digits, first digit should be 9 (mobile)
  if (digits.length === 11) {
    const firstDigit = parseInt(digits.charAt(2));
    if (firstDigit !== 9) return false;
  }
  
  return true;
}

/**
 * Formats phone number for display with country code
 * @param phone - Phone number with country code
 * @returns Formatted phone number like +55 (85) 99999-9999 or +55 (85) 9999-9999
 */
export function formatPhoneWithCountryCode(phone: string): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  if (digits.startsWith('55')) {
    if (digits.length === 12) {
      // 10 digits total (DDD + 8 digits): +55 (85) 9999-9999
      const ddd = digits.slice(2, 4);
      const number = digits.slice(4);
      return `+55 (${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
    } else if (digits.length === 13) {
      // 11 digits total (DDD + 9 digits): +55 (85) 99999-9999
      const ddd = digits.slice(2, 4);
      const number = digits.slice(4);
      return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
    }
  }
  
  return phone;
}

/**
 * Normalizes a phone number for searching (removes all formatting)
 * @param phone - Phone number in any format
 * @returns Clean digits only
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Creates variations of a phone number for flexible searching
 * @param phone - Phone number to create variations for
 * @returns Array of possible phone number variations
 */
export function createPhoneVariations(phone: string): string[] {
  const digits = normalizePhoneNumber(phone);
  const variations: string[] = [digits];
  
  if (digits.startsWith('55')) {
    // Remove country code
    const withoutCountryCode = digits.slice(2);
    variations.push(withoutCountryCode);
    
    // If it's 11 digits (DDD + 9 digits), also try without the first 9
    if (withoutCountryCode.length === 11) {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(3); // Remove the 9
      variations.push(ddd + number);
      variations.push('55' + ddd + number);
    }
    
    // If it's 10 digits (DDD + 8 digits), also try with a 9 added
    if (withoutCountryCode.length === 10) {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(2);
      variations.push(ddd + '9' + number);
      variations.push('55' + ddd + '9' + number);
    }
  } else {
    // Add country code
    variations.push('55' + digits);
    
    // If it's 10 digits (DDD + 8 digits), also try with a 9 added
    if (digits.length === 10) {
      const ddd = digits.slice(0, 2);
      const number = digits.slice(2);
      variations.push(ddd + '9' + number);
      variations.push('55' + ddd + '9' + number);
    }
    
    // If it's 11 digits (DDD + 9 digits), also try without the first 9
    if (digits.length === 11) {
      const ddd = digits.slice(0, 2);
      const number = digits.slice(3); // Remove the 9
      variations.push(ddd + number);
      variations.push('55' + ddd + number);
    }
  }
  
  // Remove duplicates
  return [...new Set(variations)];
}
