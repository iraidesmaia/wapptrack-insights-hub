
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone } from '@/lib/phoneUtils';
import { useDeviceData } from '@/hooks/useDeviceData';
import { checkFormRateLimit, validateFormData, logSecurityEvent } from '@/lib/securityValidation';

interface ContactFormProps {
  onSubmit: (phone: string, name: string) => Promise<void>;
  loading: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({ onSubmit, loading }) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { deviceData, captureAndSave } = useDeviceData();

  useEffect(() => {
    // Capturar dados do dispositivo quando o componente for montado
    console.log('📱 Capturando dados do dispositivo automaticamente');
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rate limiting check
    const clientIP = 'client_ip'; // In production, get real IP
    if (!checkFormRateLimit(clientIP)) {
      setError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      logSecurityEvent('Form rate limit exceeded', { clientIP }, 'medium');
      return;
    }
    
    // Validate and sanitize form data
    const formValidation = validateFormData({ name, phone });
    if (!formValidation.isValid) {
      setError(formValidation.errors[0]);
      logSecurityEvent('Form validation failed', { errors: formValidation.errors }, 'low');
      return;
    }
    
    const sanitizedData = formValidation.sanitizedData!;
    
    // Validate Brazilian phone format
    if (!validateBrazilianPhone(sanitizedData.phone)) {
      setError('Por favor, informe um número válido (DDD + 8 ou 9 dígitos)');
      return;
    }

    setError('');
    try {
      // Process phone to add Brazil country code (55)
      const processedPhone = processBrazilianPhone(sanitizedData.phone);
      
      // 💾 SALVAR DADOS DO DISPOSITIVO COM O TELEFONE
      console.log('💾 Salvando dados do dispositivo com telefone:', processedPhone);
      await captureAndSave(processedPhone);
      
      await onSubmit(processedPhone, sanitizedData.name);
      
      logSecurityEvent('Form submitted successfully', { phone: processedPhone }, 'low');
    } catch (err) {
      setError('Erro ao processar redirecionamento');
      logSecurityEvent('Form submission error', { error: err }, 'medium');
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
                placeholder=""
                value={phone}
                onChange={handlePhoneChange}
                className="pl-12"
                maxLength={16}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o DDD e número
            </p>
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          
          {/* Debug: mostrar dados capturados */}
          {deviceData && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
              📱 Dados capturados: {deviceData.device_type} • {deviceData.browser} • {deviceData.location}
            </div>
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
