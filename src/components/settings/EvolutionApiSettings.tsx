
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Webhook } from 'lucide-react';

interface EvolutionApiSettingsProps {
  evolutionConfig: {
    endpoint_url: string;
    api_key: string;
    instance_name: string;
  };
  testingEvolution: boolean;
  onEvolutionConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveEvolutionConfig: () => void;
  onTestEvolutionConnection: () => Promise<void>;
}

const EvolutionApiSettings = ({
  evolutionConfig,
  testingEvolution,
  onEvolutionConfigChange,
  onSaveEvolutionConfig,
  onTestEvolutionConnection
}: EvolutionApiSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Webhook className="w-5 h-5" />
          <span>Webhook Evolution API</span>
        </CardTitle>
        <CardDescription>
          Configure o webhook para receber notificações do WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="endpoint_url">URL do Webhook *</Label>
          <Input
            id="endpoint_url"
            name="endpoint_url"
            value={evolutionConfig.endpoint_url}
            onChange={onEvolutionConfigChange}
            placeholder="https://sua-instancia.com/webhook"
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            URL onde o webhook será enviado
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api_key">Chave da API (opcional)</Label>
          <Input
            id="api_key"
            name="api_key"
            value={evolutionConfig.api_key}
            onChange={onEvolutionConfigChange}
            placeholder="Sua chave da API"
            type="password"
          />
          <p className="text-xs text-muted-foreground">
            Se necessário, insira a chave de autenticação
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instance_name">Nome da Instância</Label>
          <Input
            id="instance_name"
            name="instance_name"
            value={evolutionConfig.instance_name}
            onChange={onEvolutionConfigChange}
            placeholder="default"
          />
          <p className="text-xs text-muted-foreground">
            Nome da instância do WhatsApp (padrão: default)
          </p>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onSaveEvolutionConfig} variant="outline">
            Salvar Configuração
          </Button>
          <Button 
            onClick={onTestEvolutionConnection} 
            disabled={testingEvolution || !evolutionConfig.endpoint_url}
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{testingEvolution ? 'Enviando...' : 'Testar Webhook'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiSettings;
