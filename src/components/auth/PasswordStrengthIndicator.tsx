import React from 'react';
import { Progress } from '@/components/ui/progress';
import { validatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/passwordSecurity';

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  className = '' 
}) => {
  const strength = validatePasswordStrength(password);
  const label = getPasswordStrengthLabel(strength.score);
  const colorClass = getPasswordStrengthColor(strength.score);
  
  if (!password) return null;
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Força da senha:</span>
        <span className={`text-sm font-medium ${colorClass}`}>{label}</span>
      </div>
      <Progress 
        value={(strength.score / 4) * 100} 
        className={`h-2 ${colorClass}`}
      />
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {strength.feedback.map((item, index) => (
            <li key={index} className="flex items-center gap-1">
              <span className="text-red-500">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};