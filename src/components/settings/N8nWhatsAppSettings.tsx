
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { connectWhatsApp, checkWhatsAppStatus } from '@/services/n8nService';

const N8nWhatsAppSettings = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [instanceName, setInstanceName] = useState<string | null>(null);

  // Verificar status ao carregar componente
  useEffect(() => {
    const savedInstance = localStorage.getItem('whatsapp_instance_name');
    if (savedInstance) {
      setInstanceName(savedInstance);
      checkConnectionStatus(savedInstance);
    }
  }, []);

  const checkConnectionStatus = async (instance: string) => {
    try {
      const result = await checkWhatsAppStatus(instance);
      if (result.success && result.status === 'connected') {
        setIsConnected(true);
        toast.success('WhatsApp já está conectado!');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setShowQrModal(true);
    
    try {
      const result = await connectWhatsApp();
      
      if (result.success && result.qrCode) {
        setQrCode(result.qrCode);
        setInstanceName(result.instanceName || null);
        
        if (result.instanceName) {
          localStorage.setItem('whatsapp_instance_name', result.instanceName);
        }
        
        // Iniciar polling para verificar se QR foi escaneado
        startStatusPolling(result.instanceName!);
        
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

  const startStatusPolling = (instance: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const result = await checkWhatsAppStatus(instance);
        
        if (result.success && result.status === 'connected') {
          setIsConnected(true);
          setShowQrModal(false);
          setQrCode(null);
          clearInterval(pollInterval);
          toast.success('WhatsApp conectado com sucesso!');
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

  const handleDisconnect = () => {
    setIsConnected(false);
    setInstanceName(null);
    localStorage.removeItem('whatsapp_instance_name');
    toast.success('WhatsApp desconectado');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5" />
            <span>WhatsApp Integration</span>
          </CardTitle>
          <CardDescription>
            Conecte seu WhatsApp para automatizar o envio de mensagens para leads
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="font-medium">Status da Conexão</h3>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? 'WhatsApp conectado e pronto para uso' : 'WhatsApp não conectado'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-orange-500" />
              )}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como funciona:</h4>
            <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
              <li>Clique em "Conectar WhatsApp"</li>
              <li>Escaneie o QR Code com seu WhatsApp</li>
              <li>Aguarde a confirmação de conexão</li>
              <li>Seus leads receberão mensagens automaticamente</li>
            </ol>
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
          </div>
        </CardContent>
      </Card>

      {/* Modal do QR Code */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp</DialogTitle>
            <DialogDescription>
              Escaneie o QR Code abaixo com seu WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrCode ? (
              <div className="p-4 bg-white rounded-lg">
                <img 
                  src={qrCode} 
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default N8nWhatsAppSettings;
