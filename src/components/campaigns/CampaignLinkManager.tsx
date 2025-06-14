
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, ExternalLink, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CampaignLinkManagerProps {
  campaignId: string;
  campaignName: string;
  redirectType?: string;
  whatsappNumber?: string;
}

const CampaignLinkManager: React.FC<CampaignLinkManagerProps> = ({
  campaignId,
  campaignName,
  redirectType,
  whatsappNumber
}) => {
  const baseUrl = window.location.origin;
  const campaignUrl = `${baseUrl}/redirect?campaign=${campaignId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(campaignUrl);
      toast.success('Link copiado para a área de transferência!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Erro ao copiar link');
    }
  };

  const handleOpenPreview = () => {
    window.open(campaignUrl, '_blank');
  };

  const handleDirectWhatsApp = () => {
    if (!whatsappNumber) {
      toast.error('Número do WhatsApp não configurado');
      return;
    }
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link da Campanha</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="campaign-url">URL da Campanha</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="campaign-url"
              value={campaignUrl}
              readOnly
              className="flex-1"
            />
            <Button onClick={handleCopyLink} size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleOpenPreview} variant="outline" className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          {redirectType === 'direct' && whatsappNumber && (
            <Button onClick={handleDirectWhatsApp} variant="outline" className="flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p><strong>Tipo:</strong> {redirectType === 'direct' ? 'Redirecionamento Direto' : 'Formulário de Captura'}</p>
          {whatsappNumber && (
            <p><strong>WhatsApp:</strong> {whatsappNumber}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignLinkManager;
