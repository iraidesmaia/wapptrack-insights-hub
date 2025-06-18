
import { toast } from "sonner";

export const correctPhoneNumber = (phone: string): string => {
  let correctedPhone = phone;

  console.log(`Corrigindo número: ${phone}`);

  // Caso específico do número problemático
  if (phone === '5585998732658') {
    correctedPhone = '558598372658';
    console.log(`Correção específica aplicada: ${phone} -> ${correctedPhone}`);
    return correctedPhone;
  }

  // Remover 9 duplicado em números brasileiros
  if (phone.startsWith('55') && phone.length === 13) {
    const withoutCountryCode = phone.slice(2);
    if (withoutCountryCode.length === 11 && withoutCountryCode[2] === '9' && withoutCountryCode[3] === '9') {
      correctedPhone = '55' + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3);
      console.log(`Removendo 9 duplicado: ${phone} -> ${correctedPhone}`);
      return correctedPhone;
    }
  }

  return correctedPhone;
};

export const shouldCorrectPhone = (phone: string): boolean => {
  return correctPhoneNumber(phone) !== phone;
};

// Nova função para criar todas as variações de busca de um número
export const createPhoneSearchVariations = (phone: string): string[] => {
  const originalPhone = phone;
  const correctedPhone = correctPhoneNumber(phone);
  const variations = new Set<string>();
  
  // Adicionar número original e corrigido
  variations.add(originalPhone);
  variations.add(correctedPhone);
  
  // Para cada número (original e corrigido), criar variações
  [originalPhone, correctedPhone].forEach(num => {
    // Variação sem código do país (se começar com 55)
    if (num.startsWith('55') && num.length >= 12) {
      const withoutCountry = num.slice(2);
      variations.add(withoutCountry);
      
      // Se tem 11 dígitos (DDD + 9 dígitos), tentar sem o 9 extra
      if (withoutCountry.length === 11 && withoutCountry[2] === '9') {
        const without9 = withoutCountry.slice(0, 2) + withoutCountry.slice(3);
        variations.add(without9);
        variations.add('55' + without9);
      }
      
      // Se tem 10 dígitos (DDD + 8 dígitos), tentar com 9 extra
      if (withoutCountry.length === 10) {
        const with9 = withoutCountry.slice(0, 2) + '9' + withoutCountry.slice(2);
        variations.add(with9);
        variations.add('55' + with9);
      }
    }
    
    // Variação com código do país (se não começar com 55)
    if (!num.startsWith('55')) {
      variations.add('55' + num);
      
      // Se tem 10 dígitos, tentar com 9 extra
      if (num.length === 10) {
        const with9 = num.slice(0, 2) + '9' + num.slice(2);
        variations.add(with9);
        variations.add('55' + with9);
      }
      
      // Se tem 11 dígitos e terceiro dígito é 9, tentar sem o 9
      if (num.length === 11 && num[2] === '9') {
        const without9 = num.slice(0, 2) + num.slice(3);
        variations.add(without9);
        variations.add('55' + without9);
      }
    }
  });
  
  return Array.from(variations);
};
