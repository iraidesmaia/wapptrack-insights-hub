
/**
 * Normaliza um número de telefone removendo formatação e criando variações
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove todos os caracteres não numéricos
  return phone.replace(/\D/g, '');
}

/**
 * Cria variações de um número de telefone para busca flexível
 */
export function createPhoneVariations(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const variations = new Set<string>();
  
  // Adiciona o número normalizado
  variations.add(normalized);
  
  // Se começar com 55 (código do Brasil)
  if (normalized.startsWith('55')) {
    const withoutCountryCode = normalized.slice(2);
    variations.add(withoutCountryCode);
    
    // Se tiver 11 dígitos após o código do país (DDD + 9 dígitos)
    if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9') {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(3); // Remove o 9 extra
      variations.add(ddd + number);
      variations.add('55' + ddd + number);
    }
    
    // Se tiver 10 dígitos após o código do país (DDD + 8 dígitos)
    if (withoutCountryCode.length === 10) {
      const ddd = withoutCountryCode.slice(0, 2);
      const number = withoutCountryCode.slice(2);
      variations.add(ddd + '9' + number);
      variations.add('55' + ddd + '9' + number);
    }
  } else {
    // Adiciona com código do país
    variations.add('55' + normalized);
    
    // Se tiver 10 dígitos (DDD + 8 dígitos)
    if (normalized.length === 10) {
      const ddd = normalized.slice(0, 2);
      const number = normalized.slice(2);
      variations.add(ddd + '9' + number);
      variations.add('55' + ddd + '9' + number);
    }
    
    // Se tiver 11 dígitos (DDD + 9 dígitos)
    if (normalized.length === 11 && normalized[2] === '9') {
      const ddd = normalized.slice(0, 2);
      const number = normalized.slice(3); // Remove o 9 extra
      variations.add(ddd + number);
      variations.add('55' + ddd + number);
    }
  }
  
  return Array.from(variations);
}
