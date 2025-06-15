
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone } from '@/lib/phoneUtils';

interface ContactFormProps {
  onSubmit: (phone: string, name: string) => Promise<void>;
  loading: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, loading }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      setError('Por favor, informe seu WhatsApp');
      return;
    }

    // Validate Brazilian phone format
    if (!validateBrazilianPhone(phone)) {
      setError('Por favor, informe um número válido (DDD + 8 ou 9 dígitos)');
      return;
    }

    setError('');
    try {
      // Process phone to add Brazil country code (55)
      const processedPhone = processBrazilianPhone(phone);
      await onSubmit(processedPhone, name);
    } catch (err) {
      setError('Erro ao processar redirecionamento');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar em Contato</CardTitle>
        <CardDescription>
          Por favor, informe seu WhatsApp para continuar
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Seu nome (opcional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Seu nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Seu WhatsApp*</Label>
            <div className="relative">
              {/* 
                O container a seguir mantém o "+55" visível, 
                e o input oculta números fora do espaço disponível, 
                mostrando apenas o conteúdo digitado após o "+55"
              */}
              <span
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none select-none"
                style={{
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  zIndex: 2,
                  background: 'transparent',
                  userSelect: 'none',
                }}
              >
                +55
              </span>
              <Input
                id="phone"
                type="tel"
                autoComplete="off"
                inputMode="numeric"
                pattern="[0-9 ()-]*"
                placeholder="(85) 99999-9999 ou (85) 9999-9999"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={16}
                required
                className="pl-12 pr-2 w-full block overflow-hidden text-ellipsis whitespace-nowrap bg-transparent"
                style={{
                  textIndent: 0,
                  // Faz com que só os dígitos depois do +55 fiquem visíveis
                  // O padding-left deixa espaço exato para o +55 e um espaço visual
                  paddingLeft: '2.5rem',
                  // Esconde qualquer número que passe do campo
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  // Garante que o texto nunca sai do input
                  whiteSpace: 'nowrap',
                  zIndex: 1,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o DDD e número (8 ou 9 dígitos). Ex: 85998372658 ou 8598372658
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Redirecionando...' : 'Continuar para o WhatsApp'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ContactForm;
