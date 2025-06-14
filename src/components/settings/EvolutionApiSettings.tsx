
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Webhook, Zap } from 'lucide-react';

interface EvolutionApiSettingsProps {
  evolutionConfig: {
    endpoint_url: string;
    n8n_webhook_url: string;
  };
  testingEvolution: boolean;
  onEvolutionConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveEvolutionConfig: () => void;
  onTestEvolutionConnection: () => Promise<void>;
  onTestN8nConnection: () => Promise<void>;
}

const EvolutionApiSettings = ({
  evolutionConfig,
  testingEvolution,
  onEvolutionConfigChange,
  onSaveEvolutionConfig,
  onTestEvolutionConnection,
  onTestN8nConnection
}: EvolutionApiSettingsProps) => {
  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Integração n8n</span>
          </CardTitle>
          <CardDescription>
            Configure o webhook do n8n para enviar dados de leads automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="n8n_webhook_url">URL do Webhook n8n</Label>
            <Input
              id="n8n_webhook_url"
              name="n8n_webhook_url"
              value={evolutionConfig.n8n_webhook_url}
              onChange={onEvolutionConfigChange}
              placeholder="https://sua-instancia-n8n.com/webhook/lead-capture"
              type="url"
            />
            <p className="text-xs text-muted-foreground">
              URL do webhook n8n onde os dados dos leads serão enviados
            </p>
          </div>

          <div className="flex space-x-3">
            <Button onClick={onSaveEvolutionConfig} variant="outline">
              Salvar Configuração
            </Button>
            <Button 
              onClick={onTestN8nConnection} 
              disabled={testingEvolution || !evolutionConfig.n8n_webhook_url}
              className="flex items-center space-x-2"
            >
              <Zap className="w-4 h-4" />
              <span>{testingEvolution ? 'Enviando...' : 'Testar n8n'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvolutionApiSettings;
