
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
