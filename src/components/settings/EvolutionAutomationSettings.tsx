
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Zap, QrCode, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useEvolutionAutomation } from '@/hooks/useEvolutionAutomation';
import { useSettings } from '@/hooks/useSettings';

interface EvolutionAutomationSettingsProps {
  client_id?: string;
}

const EvolutionAutomationSettings = ({ client_id }: EvolutionAutomationSettingsProps) => {
  const { 
    loading, 
    instance, 
    qrCode, 
    createAutomaticInstance, 
    loadExistingInstance,
    checkInstanceStatus 
  } = useEvolutionAutomation();

  const { formData } = useSettings();
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadExistingInstance(client_id);
  }, [client_id]);

  useEffect(() => {
    if (instance && instance.connection_status === 'waiting_scan') {
      const interval = setInterval(() => {
        checkInstanceStatus(instance.id);
      }, 5000);
      
      setStatusInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  }, [instance?.connection_status]);

  const handleCreateInstance = async () => {
    try {
      await createAutomaticInstance(client_id);
    } catch (error) {
      console.error('Error creating instance:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500';
      case 'waiting_scan': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-red-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'WhatsApp Conectado';
      case 'waiting_scan': return 'Aguardando Escaneamento';
      case 'pending': return 'Pendente';
      default: return 'Desconectado';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle className="w-4 h-4" />;
      case 'waiting_scan': return <QrCode className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5" />
          <span>Evolution API - Integração com n8n</span>
        </CardTitle>
        <CardDescription>
          Crie e configure automaticamente uma instância WhatsApp usando o nome da empresa via n8n
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {formData.company_name && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Nome da instância:</strong> {formData.company_name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_')}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Baseado no nome da empresa configurado em "Informações da Empresa"
            </p>
          </div>
        )}

        {instance ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <h3 className="font-medium">Instância: {instance.instance_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Criada em {new Date(instance.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gerenciada via n8n
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(instance.connection_status)} text-white`}>
                  {getStatusIcon(instance.connection_status)}
                  <span className="ml-1">{getStatusText(instance.connection_status)}</span>
                </Badge>
              </div>
            </div>

            {instance.webhook_configured && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Webhook configurado automaticamente via n8n</span>
              </div>
            )}

            {qrCode && instance.connection_status === 'waiting_scan' && (
              <div className="space-y-3">
                <div className="text-center">
                  <h4 className="font-medium mb-2">Escaneie o QR Code para conectar</h4>
                  <div className="inline-block p-4 bg-white rounded-lg border">
                    <img 
                      src={`data:image/png;base64,${qrCode}`} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
                  </p>
                </div>
              </div>
            )}

            {instance.connection_status === 'open' && (
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-800">WhatsApp Conectado com Sucesso!</h4>
                <p className="text-sm text-green-600">
                  Sua instância está pronta para enviar e receber mensagens automaticamente.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhuma instância configurada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie automaticamente uma instância WhatsApp com o nome da sua empresa
              </p>
              
              <Button 
                onClick={handleCreateInstance} 
                disabled={loading || !formData.company_name}
                className="flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Criando via n8n...' : 'Criar Instância Automaticamente'}</span>
              </Button>

              {!formData.company_name && (
                <p className="text-sm text-orange-600 mt-2">
                  Configure o nome da empresa em "Informações da Empresa" primeiro
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Instância criada via n8n com o nome da empresa</p>
              <p>✅ Webhook configurado automaticamente</p>
              <p>✅ QR Code gerado instantaneamente</p>
              <p>✅ Eventos MESSAGES_UPSERT e SEND_MESSAGE habilitados</p>
              <p>✅ Integração completa com automação n8n</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EvolutionAutomationSettings;
