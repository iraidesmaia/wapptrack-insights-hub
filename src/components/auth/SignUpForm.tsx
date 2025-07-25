import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import { validatePasswordStrength } from '@/lib/passwordSecurity';
import { supabase } from '@/integrations/supabase/client';
import { logSecurityEventToDatabase } from '@/lib/securityAudit';

interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export const SignUpForm: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignUpFormData>();
  const password = watch('password', '');

  const onSubmit = async (data: SignUpFormData) => {
    if (data.password !== data.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    const passwordStrength = validatePasswordStrength(data.password);
    if (!passwordStrength.isStrong) {
      setError('A senha não atende aos critérios de segurança');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError('Este email já está cadastrado. Tente fazer login.');
        } else {
          setError(error.message);
        }
        
        await logSecurityEventToDatabase({
          event_type: 'signup_failed',
          severity: 'medium',
          event_details: { email: data.email, error: error.message }
        });
      } else {
        setSuccess(true);
        await logSecurityEventToDatabase({
          event_type: 'signup_successful',
          severity: 'low',
          event_details: { email: data.email }
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError('Erro interno. Tente novamente.');
      
      await logSecurityEventToDatabase({
        event_type: 'signup_system_error',
        severity: 'high',
        event_details: { email: data.email, error: error.message }
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Alert>
        <AlertDescription>
          Conta criada com sucesso! Verifique seu email para confirmar o cadastro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email', { 
            required: 'Email é obrigatório',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Email inválido'
            }
          })}
          className={errors.email ? 'border-destructive' : ''}
        />
        {errors.email && (
          <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          {...register('password', { 
            required: 'Senha é obrigatória',
            minLength: {
              value: 8,
              message: 'Senha deve ter pelo menos 8 caracteres'
            }
          })}
          className={errors.password ? 'border-destructive' : ''}
        />
        {errors.password && (
          <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
        )}
        <PasswordStrengthIndicator password={password} className="mt-2" />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar Senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword', { 
            required: 'Confirmação de senha é obrigatória'
          })}
          className={errors.confirmPassword ? 'border-destructive' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Criando conta...' : 'Criar conta'}
      </Button>
    </form>
  );
};