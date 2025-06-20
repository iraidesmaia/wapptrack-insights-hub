
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
          Configurações da Evolution API removidas - usando integração externa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            As configurações de webhook e Evolution API foram removidas deste sistema. 
            Você pode continuar usando sua integração externa existente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvolutionApiSettings;
