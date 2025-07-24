// Password security utilities

export interface PasswordStrength {
  score: number; // 0-4 (weak to very strong)
  feedback: string[];
  isStrong: boolean;
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password) {
    return {
      score: 0,
      feedback: ['Senha é obrigatória'],
      isStrong: false
    };
  }
  
  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Senha deve ter pelo menos 8 caracteres');
  }
  
  // Complexity checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Adicione letras minúsculas');
  
  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Adicione letras maiúsculas');
  
  if (/\d/.test(password)) score++;
  else feedback.push('Adicione números');
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else feedback.push('Adicione símbolos especiais');
  
  // Additional security checks
  if (password.length >= 12) score += 0.5;
  if (!/(.)\1{2,}/.test(password)) score += 0.5; // No repeated characters
  
  // Common password patterns to avoid
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /admin/i,
    /login/i
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    score -= 1;
    feedback.push('Evite padrões comuns como "123456" ou "password"');
  }
  
  const finalScore = Math.max(0, Math.min(4, Math.floor(score)));
  
  return {
    score: finalScore,
    feedback,
    isStrong: finalScore >= 3
  };
};

export const getPasswordStrengthLabel = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'Muito fraca';
    case 2:
      return 'Fraca';
    case 3:
      return 'Boa';
    case 4:
      return 'Muito forte';
    default:
      return 'Muito fraca';
  }
};

export const getPasswordStrengthColor = (score: number): string => {
  switch (score) {
    case 0:
    case 1:
      return 'text-destructive';
    case 2:
      return 'text-orange-500';
    case 3:
      return 'text-blue-500';
    case 4:
      return 'text-green-500';
    default:
      return 'text-destructive';
  }
};