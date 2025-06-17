
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { EvolutionApiValidator, type EvolutionCredentials, type EvolutionValidationResult } from '@/services/evolutionApiValidator';
import { toast } from 'sonner';

interface EvolutionCredentialsFormProps {
  onCredentialsValidated: (credentials: EvolutionCredentials) => void;
}

const EvolutionCredentialsForm = ({ onCredentialsValidated }: EvolutionCredentialsFormProps) => {
  const [credentials, setCredentials] = useState<EvolutionCredentials>({
    baseUrl: 'https://evolutionapi.workidigital.tech',
    apiKey: 'k6KUvVBp0Nya0NtMwq7N0swJjBYSr8ia'
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<EvolutionValidationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleInputChange = (field: keyof EvolutionCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    setValidationResult(null); // Reset validation when credentials change
  };

  const validateCredentials = async () => {
    if (!credentials.baseUrl || !credentials.apiKey) {
      toast.error('Preencha URL e API Key');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await EvolutionApiValidator.validateCredentials(credentials);
      setValidationResult(result);
      
      if (result.isValid) {
        toast.success('Credenciais validadas com sucesso!');
        onCredentialsValidated(credentials);
      } else {
        toast.error(`Validação falhou: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(`Erro na validação: ${error.message}`);
      setValidationResult({
        isValid: false,
        error: error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = () => {
    if (isValidating) {
      return <Badge variant="secondary"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Validando...</Badge>;
    }
    
    if (!validationResult) {
      return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />Não validado</Badge>;
    }
    
    if (validationResult.isValid) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Válido</Badge>;
    }
    
    return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Inválido</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Credenciais Evolution API</CardTitle>
            <CardDescription>
              Configure e valide suas credenciais da Evolution API
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="baseUrl">URL Base da Evolution API</Label>
          <Input
            id="baseUrl"
            value={credentials.baseUrl}
            onChange={(e) => handleInputChange('baseUrl', e.target.value)}
            placeholder="https://sua-evolution-api.com"
            type="url"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            value={credentials.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            placeholder="sua-api-key"
            type="password"
          />
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={validateCredentials} 
            disabled={isValidating}
            className="flex items-center space-x-2"
          >
            {isValidating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            <span>{isValidating ? 'Validando...' : 'Validar Credenciais'}</span>
          </Button>
          
          {validationResult && !validationResult.isValid && (
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? 'Ocultar' : 'Ver'} Detalhes
            </Button>
          )}
        </div>

        {validationResult && !validationResult.isValid && showDetails && (
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
            <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">Detalhes do Erro:</h4>
            <p className="text-sm text-red-800 dark:text-red-200 mb-2">{validationResult.error}</p>
            {validationResult.details && (
              <pre className="text-xs bg-red-100 dark:bg-red-900 p-2 rounded overflow-auto">
                {JSON.stringify(validationResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {validationResult?.isValid && (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">✅ Validação Bem-sucedida!</h4>
            <p className="text-sm text-green-800 dark:text-green-200">
              Suas credenciais são válidas e você pode criar instâncias WhatsApp.
            </p>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como obter credenciais:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Acesse sua instância da Evolution API</li>
            <li>Gere uma API Key nas configurações</li>
            <li>Copie a URL base (sem /instance no final)</li>
            <li>Cole aqui e clique em "Validar Credenciais"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionCredentialsForm;
