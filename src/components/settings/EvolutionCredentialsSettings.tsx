
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Key, Globe, CheckCircle, AlertCircle, Trash2, Shield } from 'lucide-react';
import { useEvolutionCredentials } from '@/hooks/useEvolutionCredentials';

const EvolutionCredentialsSettings = () => {
  const {
    credentials,
    loading,
    validating,
    formData,
    handleInputChange,
    validateCredentials,
    saveCredentials,
    deleteCredentials
  } = useEvolutionCredentials();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Válidas</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Inválidas</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="w-5 h-5" />
          <span>Credenciais Evolution API</span>
        </CardTitle>
        <CardDescription>
          Configure suas credenciais da Evolution API para automação do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {credentials && (
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <h4 className="font-medium">Status das Credenciais</h4>
              <p className="text-sm text-muted-foreground">
                Última validação: {credentials.validated_at ? new Date(credentials.validated_at).toLocaleString() : 'Nunca'}
              </p>
            </div>
            {getStatusBadge(credentials.status)}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="api_url" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>URL Base da Evolution API *</span>
            </Label>
            <Input
              id="api_url"
              name="api_url"
              value={formData.api_url}
              onChange={handleInputChange}
              placeholder="https://www.evolutionapi.workidigital.tech"
              type="url"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua instância Evolution API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key" className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Chave da API *</span>
            </Label>
            <Input
              id="api_key"
              name="api_key"
              value={formData.api_key}
              onChange={handleInputChange}
              placeholder="E68579E80460-4186-AFD3-10CBAAE2A655"
              type="password"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Chave de API para autenticação na Evolution API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instance_name">Nome da Instância (Opcional)</Label>
            <Input
              id="instance_name"
              name="instance_name"
              value={formData.instance_name}
              onChange={handleInputChange}
              placeholder="minha-instancia-whatsapp"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Nome personalizado para a instância (será gerado automaticamente se vazio)
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como configurar:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Insira a URL base da sua Evolution API</li>
            <li>Cole sua chave de API da Evolution</li>
            <li>Clique em "Validar Credenciais" para testar a conexão</li>
            <li>Se válidas, clique em "Salvar Configuração"</li>
            <li>Agora você pode criar instâncias do WhatsApp</li>
          </ol>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
          <h4 className="font-medium text-amber-900 dark:text-amber-100 mb-2">Credenciais Padrão:</h4>
          <div className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
            <p><strong>URL:</strong> https://www.evolutionapi.workidigital.tech</p>
            <p><strong>API Key:</strong> E68579E80460-4186-AFD3-10CBAAE2A655</p>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={validateCredentials} 
            disabled={loading || validating || !formData.api_url || !formData.api_key}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{validating ? 'Validando...' : 'Validar Credenciais'}</span>
          </Button>

          <Button 
            onClick={saveCredentials} 
            disabled={loading || validating || !formData.api_url || !formData.api_key}
            className="flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Configuração'}</span>
          </Button>

          {credentials && (
            <Button 
              onClick={deleteCredentials}
              variant="destructive"
              disabled={loading}
              className="flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Remover</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionCredentialsSettings;
