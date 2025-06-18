
export const formatBrazilianPhone = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se começar com 55 (código do país), remove
  const cleanNumbers = numbers.startsWith('55') && numbers.length > 11 
    ? numbers.slice(2) 
    : numbers;
  
  // Aplica a máscara baseada no tamanho
  if (cleanNumbers.length <= 2) {
    return `(${cleanNumbers}`;
  } else if (cleanNumbers.length <= 6) {
    return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2)}`;
  } else if (cleanNumbers.length <= 10) {
    return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 6)}-${cleanNumbers.slice(6)}`;
  } else {
    // Para números com 11 dígitos (9 + 8 dígitos)
    return `(${cleanNumbers.slice(0, 2)}) ${cleanNumbers.slice(2, 7)}-${cleanNumbers.slice(7, 11)}`;
  }
};

export const processBrazilianPhone = (phone: string): string => {
  // Remove todos os caracteres não numéricos
  const numbers = phone.replace(/\D/g, '');
  
  // Se começar com 55, mantém como está
  if (numbers.startsWith('55') && numbers.length >= 12) {
    return numbers;
  }
  
  // Se não começar com 55, adiciona o código do país
  if (numbers.length >= 10) {
    return '55' + numbers;
  }
  
  return numbers;
};

export const validateBrazilianPhone = (phone: string): boolean => {
  const numbers = phone.replace(/\D/g, '');
  
  // Remove código do país se presente
  const localNumber = numbers.startsWith('55') && numbers.length > 11 
    ? numbers.slice(2) 
    : numbers;
  
  // Deve ter 10 ou 11 dígitos
  if (localNumber.length !== 10 && localNumber.length !== 11) {
    return false;
  }
  
  // DDD deve estar entre 11 e 99
  const ddd = parseInt(localNumber.slice(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  // Para números de 11 dígitos, o terceiro dígito deve ser 9
  if (localNumber.length === 11 && localNumber[2] !== '9') {
    return false;
  }
  
  return true;
};

export const formatPhoneWithCountryCode = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.startsWith('55') && numbers.length >= 12) {
    const localNumber = numbers.slice(2);
    return `+55 ${formatBrazilianPhone(localNumber)}`;
  }
  
  return `+55 ${formatBrazilianPhone(phone)}`;
};
