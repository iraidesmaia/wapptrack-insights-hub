import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Zap, QrCode, CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useEvolutionAutomation } from '@/hooks/useEvolutionAutomation';
import { useSettings } from '@/hooks/useSettings';
interface EvolutionAutomationSettingsProps {
  client_id?: string;
}
const EvolutionAutomationSettings = ({
  client_id
}: EvolutionAutomationSettingsProps) => {
  const {
    loading,
    instance,
    qrCode,
    createAutomaticInstance,
    loadExistingInstance,
    checkInstanceStatus,
    generateNewQrCode,
    resetInstanceState
  } = useEvolutionAutomation();
  const {
    formData
  } = useSettings();
  const [statusInterval, setStatusInterval] = useState<NodeJS.Timeout | null>(null);
  useEffect(() => {
    loadExistingInstance(client_id);
  }, [client_id]);
  const startStatusPolling = useCallback(() => {
    if (statusInterval) {
      clearInterval(statusInterval);
    }
    const interval = setInterval(async () => {
      if (instance) {
        const result = await checkInstanceStatus(instance.id);
        // Se retornou null, significa que foi resetado
        if (result === null) {
          clearInterval(interval);
          setStatusInterval(null);
        }
      }
    }, 5000);
    setStatusInterval(interval);
  }, [instance, checkInstanceStatus]);
  const stopStatusPolling = useCallback(() => {
    if (statusInterval) {
      clearInterval(statusInterval);
      setStatusInterval(null);
    }
  }, [statusInterval]);
  useEffect(() => {
    if (instance) {
      if (instance.connection_status === 'waiting_scan' || instance.connection_status === 'pending') {
        startStatusPolling();
      } else {
        stopStatusPolling();
      }
    } else {
      stopStatusPolling();
    }
    return () => stopStatusPolling();
  }, [instance?.connection_status, startStatusPolling, stopStatusPolling]);
  const handleCreateInstance = async () => {
    try {
      await createAutomaticInstance(client_id);
    } catch (error) {
      console.error('Error creating instance:', error);
    }
  };
  const handleGenerateNewQr = async () => {
    try {
      await generateNewQrCode();
    } catch (error) {
      console.error('Error generating new QR:', error);
    }
  };
  const handleResetInstance = () => {
    resetInstanceState();
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500';
      case 'waiting_scan':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-red-500';
    }
  };
  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'WhatsApp Conectado';
      case 'waiting_scan':
        return 'Aguardando Escaneamento';
      case 'pending':
        return 'Pendente';
      default:
        return 'Desconectado';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="w-4 h-4" />;
      case 'waiting_scan':
        return <QrCode className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };
  return <Card>
      
      <CardContent className="space-y-6">
        {formData.company_name}

        {instance ? <div className="space-y-4">
            

            {instance.webhook_configured && <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Webhook configurado automaticamente via n8n</span>
              </div>}

            {instance.connection_status === 'waiting_scan' && <div className="space-y-3">
                {qrCode ? <div className="text-center">
                    <h4 className="font-medium mb-2">Escaneie o QR Code para conectar</h4>
                    <div className="inline-block p-4 bg-white rounded-lg border">
                      <img src={`data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="w-48 h-48" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
                    </p>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button onClick={handleGenerateNewQr} disabled={loading} variant="outline" size="sm" className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4" />
                        <span>{loading ? 'Gerando...' : 'Gerar Novo QR'}</span>
                      </Button>
                      <Button onClick={handleResetInstance} variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        Cancelar Conexão
                      </Button>
                    </div>
                  </div> : <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <QrCode className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <h4 className="font-medium text-yellow-800">Gerando QR Code...</h4>
                    <p className="text-sm text-yellow-600">
                      Aguarde enquanto o QR Code é gerado.
                    </p>
                    <Button onClick={handleGenerateNewQr} disabled={loading} className="mt-3" size="sm">
                      {loading ? 'Gerando...' : 'Tentar Novamente'}
                    </Button>
                  </div>}
              </div>}

            {instance.connection_status === 'open' && <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h4 className="font-medium text-green-800">WhatsApp Conectado com Sucesso!</h4>
                <p className="text-sm text-green-600">
                  Sua instância está pronta para enviar e receber mensagens automaticamente.
                </p>
                <Button onClick={handleResetInstance} variant="outline" size="sm" className="mt-3 text-red-600 hover:text-red-700">
                  Desconectar Instância
                </Button>
              </div>}
          </div> : <div className="space-y-4">
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium mb-2">Nenhuma instância configurada</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie automaticamente uma instância WhatsApp com o nome da sua empresa
              </p>
              
              <Button onClick={handleCreateInstance} disabled={loading || !formData.company_name} className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>{loading ? 'Criando via n8n...' : 'Criar Instância Automaticamente'}</span>
              </Button>

              {!formData.company_name && <p className="text-sm text-orange-600 mt-2">
                  Configure o nome da empresa em "Informações da Empresa" primeiro
                </p>}
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Instância criada via n8n com o nome da empresa</p>
              <p>✅ Webhook configurado automaticamente</p>
              <p>✅ QR Code gerado instantaneamente</p>
              <p>✅ Reconexão automática quando desconectar</p>
              <p>✅ Integração completa com automação n8n</p>
            </div>
          </div>}
      </CardContent>
    </Card>;
};
export default EvolutionAutomationSettings;