
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, QrCode, Trash2, RefreshCw, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { useWhatsAppInstance } from '@/hooks/useWhatsAppInstance';
import EvolutionCredentialsForm from './EvolutionCredentialsForm';

const WhatsAppInstanceSettings = () => {
  const { instance, qrCode, loading, requestQrCode, deleteInstance, setCredentials, evolutionCredentials } = useWhatsAppInstance();
  const [activeTab, setActiveTab] = useState('instance');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'QRCODE_WAITING':
        return <Badge variant="secondary"><QrCode className="w-3 h-3 mr-1" />Aguardando QR Code</Badge>;
      case 'DISCONNECTED':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleCredentialsValidated = (credentials: any) => {
    setCredentials(credentials);
    setActiveTab('instance');
  };

  const handleCreateInstance = () => {
    if (evolutionCredentials) {
      requestQrCode(evolutionCredentials);
    } else {
      requestQrCode();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>WhatsApp - Evolution API</span>
        </CardTitle>
        <CardDescription>
          Conecte seu WhatsApp para automação de leads e mensagens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="instance">Instância</TabsTrigger>
            <TabsTrigger value="credentials">
              <Settings className="w-4 h-4 mr-2" />
              Credenciais
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="instance" className="space-y-4">
            {instance ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Status da Conexão</h4>
                    <p className="text-sm text-muted-foreground">
                      Instância: {instance.instance_name}
                    </p>
                  </div>
                  {getStatusBadge(instance.status)}
                </div>

                {instance.phone_number && (
                  <div>
                    <h4 className="font-medium">Telefone Conectado</h4>
                    <p className="text-sm text-muted-foreground">{instance.phone_number}</p>
                  </div>
                )}

                {instance.user_name_wpp && (
                  <div>
                    <h4 className="font-medium">Nome do Usuário</h4>
                    <p className="text-sm text-muted-foreground">{instance.user_name_wpp}</p>
                  </div>
                )}

                {qrCode && instance.status !== 'CONNECTED' && (
                  <div className="text-center space-y-4">
                    <h4 className="font-medium">Escaneie o QR Code com seu WhatsApp</h4>
                    <div className="flex justify-center">
                      <img 
                        src={`data:image/png;base64,${qrCode}`} 
                        alt="QR Code WhatsApp"
                        className="w-64 h-64 border rounded-lg"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Abra o WhatsApp → Menu → Dispositivos conectados → Conectar dispositivo
                    </p>
                  </div>
                )}

                <div className="flex space-x-3">
                  {instance.status !== 'CONNECTED' && (
                    <Button 
                      onClick={handleCreateInstance}
                      disabled={loading}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                      <span>{loading ? 'Gerando...' : 'Gerar Novo QR Code'}</span>
                    </Button>
                  )}
                  
                  <Button 
                    onClick={deleteInstance}
                    variant="destructive"
                    className="flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover Instância</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="py-8">
                  <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h4 className="font-medium mb-2">Nenhuma instância do WhatsApp</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Crie uma nova instância para começar a usar o WhatsApp
                  </p>
                  
                  {evolutionCredentials && (
                    <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg mb-4">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        ✅ Credenciais configuradas: {evolutionCredentials.baseUrl}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={loading}
                    className="flex items-center space-x-2"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>{loading ? 'Criando...' : 'Conectar WhatsApp'}</span>
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="credentials">
            <EvolutionCredentialsForm onCredentialsValidated={handleCredentialsValidated} />
          </TabsContent>
        </Tabs>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg mt-6">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como funciona:</h4>
          <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Configure suas credenciais na aba "Credenciais"</li>
            <li>Clique em "Conectar WhatsApp" para gerar um QR Code único</li>
            <li>Escaneie o QR Code com seu WhatsApp</li>
            <li>Sua instância ficará conectada e pronta para automação</li>
            <li>Leads serão automaticamente processados via WhatsApp</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default WhatsAppInstanceSettings;
