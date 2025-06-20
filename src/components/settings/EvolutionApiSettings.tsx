
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageSquare } from 'lucide-react';

interface EvolutionApiConfig {
  evolution_api_key: string;
  evolution_instance_name: string;
  evolution_base_url: string;
  webhook_callback_url: string;
  webhook_url: string;
}

interface EvolutionApiSettingsProps {
  evolutionConfig: EvolutionApiConfig;
  testingWebhook: boolean;
  onEvolutionConfigChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
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
          <MessageSquare className="w-5 h-5" />
          <span>Evolution API - WhatsApp Integration</span>
        </CardTitle>
        <CardDescription>
          Configure a Evolution API para automatizar o processo de validação de leads via WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="evolution_base_url">URL Base da Evolution API *</Label>
            <Input 
              id="evolution_base_url" 
              name="evolution_base_url" 
              value={evolutionConfig.evolution_base_url} 
              onChange={onEvolutionConfigChange} 
              placeholder="https://api.evolution.com" 
              type="url" 
            />
            <p className="text-xs text-muted-foreground">
              URL base da sua instância Evolution API
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evolution_instance_name">Nome da Instância *</Label>
            <Input 
              id="evolution_instance_name" 
              name="evolution_instance_name" 
              value={evolutionConfig.evolution_instance_name} 
              onChange={onEvolutionConfigChange} 
              placeholder="minha-instancia" 
            />
            <p className="text-xs text-muted-foreground">
              Nome da instância WhatsApp na Evolution API
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evolution_api_key">API Key da Evolution *</Label>
          <Input 
            id="evolution_api_key" 
            name="evolution_api_key" 
            value={evolutionConfig.evolution_api_key} 
            onChange={onEvolutionConfigChange} 
            placeholder="sua-api-key-evolution" 
            type="password" 
          />
          <p className="text-xs text-muted-foreground">
            Chave de API para autenticação na Evolution API
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhook_callback_url">URL de Callback (Webhook de Retorno)</Label>
          <Input 
            id="webhook_callback_url" 
            name="webhook_callback_url" 
            value={evolutionConfig.webhook_callback_url} 
            onChange={onEvolutionConfigChange} 
            placeholder="https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook" 
            type="url" 
            readOnly 
          />
          <p className="text-xs text-muted-foreground">
            URL que a Evolution API usará para enviar confirmações de entrega
          </p>
        </div>

        <div className="flex space-x-3">
          <Button onClick={onSaveEvolutionConfig} variant="outline">
            Salvar Configuração
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiSettings;
