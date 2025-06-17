
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Smartphone, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { 
  connectInstance, 
  getInstanceStatus, 
  configureWebhook,
  checkInstanceExists 
} from '@/services/evolutionDirectService';

const EvolutionWhatsAppSettings = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [instanceStatus, setInstanceStatus] = useState<string>('disconnected');
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  // Verificar status ao carregar componente
  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const result = await getInstanceStatus();
      if (result.success) {
        const connected = result.status === 'connected';
        setIsConnected(connected);
        setInstanceStatus(result.status || 'disconnected');
        
        if (connected) {
          toast.success('WhatsApp conectado (instância wapptrack)!');
          // Garantir que webhook está configurado
          await configureWebhook();
        }
      } else {
        // Se não conseguir verificar status, verificar se instância existe
        const existsCheck = await checkInstanceExists();
        if (existsCheck.success) {
          setInstanceStatus(existsCheck.status || 'disconnected');
          setIsConnected(existsCheck.status === 'connected');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setShowQrModal(true);
    
    try {
      const result = await connectInstance();
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        setInstanceStatus('connecting');
        
        // Iniciar polling para verificar se QR foi escaneado
        startStatusPolling();
        
        toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
      } else {
        throw new Error(result.error || 'Erro ao gerar QR Code');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar WhatsApp');
      setShowQrModal(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const startStatusPolling = () => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await getInstanceStatus();
        
        if (result.success && result.status === 'connected') {
          setIsConnected(true);
          setInstanceStatus('connected');
          setShowQrModal(false);
          setQrCode(null);
          clearInterval(pollInterval);
          
          // Configurar webhook após conexão bem-sucedida
          await configureWebhook();
          toast.success('WhatsApp conectado com sucesso (wapptrack)!');
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Limpar polling após 5 minutos
    setTimeout(() => {
      clearInterval(pollInterval);
      if (!isConnected) {
        setShowQrModal(false);
        toast.error('Tempo limite para escaneamento do QR Code');
      }
    }, 300000);
  };

  const handleDisconnect = async () => {
    setIsConnected(false);
    setInstanceStatus('disconnected');
    toast.success('WhatsApp desconectado');
  };

  const getStatusColor = () => {
    switch (instanceStatus) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      default: return 'text-red-600';
    }
  };

  const getStatusIcon = () => {
    switch (instanceStatus) {
      case 'connected': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'connecting': return <Wifi className="w-6 h-6 text-yellow-600 animate-pulse" />;
      default: return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getStatusText = () => {
    switch (instanceStatus) {
      case 'connected': return 'WhatsApp conectado (instância: wapptrack)';
      case 'connecting': return 'Conectando WhatsApp...';
      default: return 'WhatsApp não conectado';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>Evolution API - WhatsApp Integration</span>
          </CardTitle>
          <CardDescription>
            Integração direta com Evolution API (instância: wapptrack)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-medium">Status da Conexão</h3>
                <p className={`text-sm ${getStatusColor()}`}>
                  {getStatusText()}
                </p>
                {instanceStatus === 'connected' && (
                  <p className="text-xs text-muted-foreground">
                    Webhook configurado automaticamente
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como funciona:</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar WhatsApp"</li>
              <li>Escaneie o QR Code com seu WhatsApp</li>
              <li>Aguarde a confirmação de conexão</li>
              <li>Webhook será configurado automaticamente</li>
              <li>Seus leads receberão mensagens via instância wapptrack</li>
            </ol>
          </div>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Configuração Automática:</h4>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>• <strong>Instância:</strong> wapptrack</li>
              <li>• <strong>Webhook:</strong> Configurado automaticamente</li>
              <li>• <strong>Eventos:</strong> MESSAGES_UPSERT</li>
              <li>• <strong>URL:</strong> https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                size="lg"
                className="flex-1"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {isConnecting ? 'Gerando QR Code...' : 'Conectar WhatsApp'}
              </Button>
            ) : (
              <Button 
                onClick={handleDisconnect} 
                variant="outline"
                size="lg"
                className="flex-1"
              >
                Desconectar WhatsApp
              </Button>
            )}
            
            <Button 
              onClick={checkConnectionStatus} 
              disabled={isCheckingStatus}
              variant="outline"
              size="lg"
            >
              {isCheckingStatus ? 'Verificando...' : 'Verificar Status'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal do QR Code */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp - Instância wapptrack</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com seu WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCode ? (
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code WhatsApp" 
                  className="w-64 h-64"
                />
              </div>
            ) : (
              <div className="w-64 h-64 bg-muted rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Instruções:</p>
              <ol className="text-xs text-muted-foreground space-y-1">
                <li>1. Abra o WhatsApp no seu celular</li>
                <li>2. Toque em Menu → Dispositivos conectados</li>
                <li>3. Toque em "Conectar um dispositivo"</li>
                <li>4. Escaneie este QR Code</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">
                Instância: wapptrack
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EvolutionWhatsAppSettings;
