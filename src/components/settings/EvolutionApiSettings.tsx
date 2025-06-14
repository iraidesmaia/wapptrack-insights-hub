
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Webhook } from 'lucide-react';

interface EvolutionApiSettingsProps {
  evolutionConfig: {
    webhook_url: string;
  };
  testingWebhook: boolean;
  onEvolutionConfigChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSaveEvolutionConfig: () => void;
  onTestWebhookConnection: () => Promise<void>;
}

const EvolutionApiSettings = ({
  evolutionConfig,
  testingWebhook,
  onEvolutionConfigChange,
  onSaveEvolutionConfig,
  onTestWebhookConnection
}: EvolutionApiSettingsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Webhook className="w-5 h-5" />
          <span>Webhook para Leads</span>
        </CardTitle>
        <CardDescription>
          Configure o webhook para receber dados dos leads automaticamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="webhook_url">URL do Webhook *</Label>
          <Input
            id="webhook_url"
            name="webhook_url"
            value={evolutionConfig.webhook_url}
            onChange={onEvolutionConfigChange}
            placeholder="https://webhook.site/seu-webhook"
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            URL onde os dados dos leads serão enviados
          </p>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onSaveEvolutionConfig} variant="outline">
            Salvar Configuração
          </Button>
          <Button 
            onClick={onTestWebhookConnection} 
            disabled={testingWebhook || !evolutionConfig.webhook_url}
            className="flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{testingWebhook ? 'Enviando...' : 'Testar Webhook'}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiSettings;
