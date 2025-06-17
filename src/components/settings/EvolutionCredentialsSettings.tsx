
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckCircle, AlertCircle, Key } from 'lucide-react';
import { useEvolutionCredentials } from '@/hooks/useEvolutionCredentials';

const EvolutionCredentialsSettings = () => {
  const {
    credentials,
    formData,
    loading,
    validating,
    handleInputChange,
    validateCredentials,
    deleteCredentials
  } = useEvolutionCredentials();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Válidas</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Inválidas</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
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
          Configure suas credenciais pessoais da Evolution API para conectar o WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {credentials ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Status das Credenciais</h4>
                <p className="text-sm text-muted-foreground">
                  Validadas em: {credentials.validated_at ? new Date(credentials.validated_at).toLocaleString() : 'Nunca'}
                </p>
              </div>
              {getStatusBadge(credentials.status)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">URL da API</h4>
                <p className="text-sm text-muted-foreground">{credentials.api_url}</p>
              </div>
              
              {credentials.instance_name && (
                <div>
                  <h4 className="font-medium">Nome da Instância</h4>
                  <p className="text-sm text-muted-foreground">{credentials.instance_name}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <Button 
                onClick={deleteCredentials}
                variant="destructive"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loading ? 'Removendo...' : 'Remover Credenciais'}</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="api_url">URL da Evolution API *</Label>
                <Input
                  id="api_url"
                  name="api_url"
                  value={formData.api_url}
                  onChange={handleInputChange}
                  placeholder="https://sua-evolution-api.com"
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  URL base da sua instância Evolution API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_key">Chave da API *</Label>
                <Input
                  id="api_key"
                  name="api_key"
                  value={formData.api_key}
                  onChange={handleInputChange}
                  placeholder="sua-chave-da-api"
                  type="password"
                />
                <p className="text-xs text-muted-foreground">
                  Chave de autenticação da sua Evolution API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance_name">Nome da Instância (Opcional)</Label>
                <Input
                  id="instance_name"
                  name="instance_name"
                  value={formData.instance_name}
                  onChange={handleInputChange}
                  placeholder="minha-instancia"
                />
                <p className="text-xs text-muted-foreground">
                  Nome preferido para suas instâncias (opcional)
                </p>
              </div>
            </div>

            <Button 
              onClick={validateCredentials}
              disabled={validating || !formData.api_url || !formData.api_key}
              className="w-full"
            >
              {validating ? 'Validando...' : 'Validar e Salvar Credenciais'}
            </Button>
          </div>
        )}

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como configurar:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Acesse o painel da sua Evolution API</li>
            <li>Copie a URL base da API (ex: https://sua-api.com)</li>
            <li>Gere ou copie sua chave de API</li>
            <li>Cole as informações acima e clique em "Validar"</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionCredentialsSettings;
