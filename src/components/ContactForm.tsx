
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
      setError('Por favor, informe um número válido (DDD + 9 dígitos)');
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                +55
              </div>
              <Input
                id="phone"
                type="tel"
                placeholder="(85) 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-12"
                maxLength={15}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite apenas o DDD e número (ex: 85999999999)
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
