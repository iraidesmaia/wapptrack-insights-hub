
// Função para criar variações do telefone para busca no banco
export const createPhoneSearchVariations = (phone: string): string[] => {
  const cleanPhone = phone.replace(/\D/g, '');
  const variations = new Set<string>();
  
  // Adicionar o número original limpo
  variations.add(cleanPhone);
  
  // Se tem 11 dígitos (celular com 9)
  if (cleanPhone.length === 11) {
    // Versão sem o 9 (formato antigo)
    const withoutNine = cleanPhone.slice(0, 2) + cleanPhone.slice(3);
    variations.add(withoutNine);
    
    // Com código do país
    variations.add('55' + cleanPhone);
    variations.add('55' + withoutNine);
  }
  
  // Se tem 10 dígitos (celular sem 9 ou fixo)
  if (cleanPhone.length === 10) {
    // Versão com o 9 (formato novo para celular)
    const withNine = cleanPhone.slice(0, 2) + '9' + cleanPhone.slice(2);
    variations.add(withNine);
    
    // Com código do país
    variations.add('55' + cleanPhone);
    variations.add('55' + withNine);
  }
  
  // Se tem 13 dígitos (com código do país)
  if (cleanPhone.length === 13 && cleanPhone.startsWith('55')) {
    const withoutCountryCode = cleanPhone.slice(2);
    variations.add(withoutCountryCode);
    
    // Se o número sem código tem 11 dígitos
    if (withoutCountryCode.length === 11) {
      const withoutNine = withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3);
      variations.add(withoutNine);
      variations.add('55' + withoutNine);
    }
    
    // Se o número sem código tem 10 dígitos
    if (withoutCountryCode.length === 10) {
      const withNine = withoutCountryCode.slice(0, 2) + '9' + withoutCountryCode.slice(2);
      variations.add(withNine);
      variations.add('55' + withNine);
    }
  }
  
  // Se tem 12 dígitos (com código do país, sem 9)
  if (cleanPhone.length === 12 && cleanPhone.startsWith('55')) {
    const withoutCountryCode = cleanPhone.slice(2);
    variations.add(withoutCountryCode);
    
    // Versão com 9
    const withNine = withoutCountryCode.slice(0, 2) + '9' + withoutCountryCode.slice(2);
    variations.add(withNine);
    variations.add('55' + withNine);
  }
  
  return Array.from(variations);
};

// Função para verificar se um número precisa de correção
export const shouldCorrectPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Números que precisam de correção:
  // - 10 dígitos iniciando com DDD válido (11-99) e segundo dígito 8 ou 9
  if (cleanPhone.length === 10) {
    const ddd = parseInt(cleanPhone.slice(0, 2));
    const firstDigit = cleanPhone[2];
    
    // DDD válido e primeiro dígito do número é 8 ou 9 (indica celular)
    if (ddd >= 11 && ddd <= 99 && (firstDigit === '8' || firstDigit === '9')) {
      return true;
    }
  }
  
  return false;
};

// Função para corrigir número de telefone
export const correctPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Se tem 10 dígitos e é celular, adicionar o 9
  if (shouldCorrectPhone(cleanPhone)) {
    const ddd = cleanPhone.slice(0, 2);
    const number = cleanPhone.slice(2);
    return ddd + '9' + number;
  }
  
  return cleanPhone;
};
