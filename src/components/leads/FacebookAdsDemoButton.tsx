
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Facebook, Smartphone, MapPin, Clock, Globe, Monitor } from 'lucide-react';
import { createFacebookAdsDemo } from '@/services/demoLeadService';
import { toast } from 'sonner';

interface FacebookAdsDemoButtonProps {
  onLeadCreated: () => void;
}

const FacebookAdsDemoButton = ({ onLeadCreated }: FacebookAdsDemoButtonProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleCreateDemo = async () => {
    setIsCreating(true);
    try {
      const demoLead = await createFacebookAdsDemo();
      if (demoLead) {
        toast.success('Lead de demonstração Facebook Ads criado com sucesso!');
        onLeadCreated();
        setShowPreview(false);
      } else {
        toast.error('Erro ao criar lead de demonstração');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar lead de demonstração');
    } finally {
      setIsCreating(false);
    }
  };

  if (showPreview) {
    return (
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Facebook className="w-5 h-5 text-blue-600" />
            <span>Prévia: Lead Facebook Ads</span>
          </CardTitle>
          <CardDescription>
            Assim chegará um lead vindo de anúncios do Facebook/Instagram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações Básicas */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">📋 Informações Básicas</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><strong>Nome:</strong> Maria Silva (Demo Facebook Ads)</div>
              <div><strong>Telefone:</strong> (85) 98765-4321</div>
              <div><strong>Campanha:</strong> <Badge className="bg-blue-100 text-blue-800">Meta Ads - ad</Badge></div>
              <div><strong>Status:</strong> <Badge className="bg-green-100 text-green-800">Lead</Badge></div>
            </div>
          </div>

          {/* Dados da Evolution API */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Facebook className="w-4 h-4" />
              <span>🎯 Dados da Evolution API</span>
            </h4>
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <div><strong>Source ID:</strong> <code className="bg-gray-100 px-1 rounded">120224327256080723</code></div>
              <div><strong>Media URL:</strong> <code className="bg-gray-100 px-1 rounded text-xs">https://www.instagram.com/p/DLXbeFpsMH_/</code></div>
              <div><strong>CTWA Click ID:</strong> <code className="bg-gray-100 px-1 rounded text-xs">AffI2Qc02348Le0F...</code></div>
              <div><strong>Source Type:</strong> <Badge variant="outline">ad</Badge></div>
            </div>
          </div>

          {/* UTMs Gerados */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">🔗 UTMs Gerados Automaticamente</h4>
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <div><strong>UTM Source:</strong> facebook</div>
              <div><strong>UTM Medium:</strong> social</div>
              <div><strong>UTM Campaign:</strong> ctwa_AffI2Qc0</div>
              <div><strong>UTM Content:</strong> 120224327256080723</div>
            </div>
          </div>

          {/* Dados do Dispositivo */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>📱 Dados do Dispositivo</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center space-x-1">
                <Monitor className="w-3 h-3" />
                <span><strong>Dispositivo:</strong> Mobile</span>
              </div>
              <div><strong>Browser:</strong> Instagram App</div>
              <div className="flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span><strong>Localização:</strong> Fortaleza, CE</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span><strong>Timezone:</strong> America/Fortaleza</span>
              </div>
              <div className="flex items-center space-x-1">
                <Globe className="w-3 h-3" />
                <span><strong>Idioma:</strong> pt-BR</span>
              </div>
              <div><strong>OS:</strong> Android</div>
            </div>
          </div>

          {/* Facebook Ads IDs */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">🎯 IDs do Facebook Ads</h4>
            <div className="bg-white p-3 rounded border text-sm space-y-1">
              <div><strong>Ad ID:</strong> <code className="bg-gray-100 px-1 rounded">23851234567890123</code></div>
              <div><strong>Adset ID:</strong> <code className="bg-gray-100 px-1 rounded">23851234567890124</code></div>
              <div><strong>Campaign ID:</strong> <code className="bg-gray-100 px-1 rounded">23851234567890125</code></div>
            </div>
          </div>

          <div className="flex space-x-2 pt-4">
            <Button 
              onClick={handleCreateDemo} 
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Criando...' : 'Criar Lead Demo'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowPreview(false)}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Button 
      onClick={() => setShowPreview(true)}
      variant="outline"
      className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
    >
      <Facebook className="w-4 h-4 mr-2" />
      Ver Como Chega Lead do Facebook Ads
    </Button>
  );
};

export default FacebookAdsDemoButton;
