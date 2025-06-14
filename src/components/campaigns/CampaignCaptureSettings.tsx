
import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Campaign } from '@/types';

interface CampaignCaptureSettingsProps {
  campaign: Campaign;
  onCampaignChange: (updates: Partial<Campaign>) => void;
}

const CampaignCaptureSettings: React.FC<CampaignCaptureSettingsProps> = ({
  campaign,
  onCampaignChange
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Captura</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="redirect-type">Tipo de Redirecionamento</Label>
            <Select
              value={campaign.redirect_type || 'form'}
              onValueChange={(value) => onCampaignChange({ redirect_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form">Formulário de Captura</SelectItem>
                <SelectItem value="direct">Redirecionamento Direto para WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {campaign.redirect_type === 'direct' 
                ? 'Redireciona diretamente para o WhatsApp sem formulário'
                : 'Mostra um formulário antes de redirecionar para o WhatsApp'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Automação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="active">Campanha Ativa</Label>
              <p className="text-xs text-muted-foreground">
                Quando desativada, a campanha não aceitará novos leads
              </p>
            </div>
            <Switch
              id="active"
              checked={campaign.active || false}
              onCheckedChange={(checked) => onCampaignChange({ active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-create-leads">Criar Leads Automaticamente</Label>
              <p className="text-xs text-muted-foreground">
                Cria automaticamente registros de leads no sistema
              </p>
            </div>
            <Switch
              id="auto-create-leads"
              checked={campaign.auto_create_leads !== false}
              onCheckedChange={(checked) => onCampaignChange({ auto_create_leads: checked })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CampaignCaptureSettings;
