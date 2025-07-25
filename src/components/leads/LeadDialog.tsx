
import React from 'react';
import { Lead, Campaign } from '@/types';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Copy, Smartphone, Monitor, Tablet, Globe, Clock, MapPin, Link } from 'lucide-react';
import { toast } from "sonner";

interface LeadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  currentLead: Partial<Lead>;
  campaigns: Campaign[];
  onSave: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (name: string, value: string) => void;
}

const LeadDialog: React.FC<LeadDialogProps> = ({
  isOpen,
  onClose,
  mode,
  currentLead,
  campaigns,
  onSave,
  onInputChange,
  onPhoneChange,
  onSelectChange
}) => {
  console.log('[LeadsTable UX]', 'Modal opened with lead data:', currentLead);

  const getDeviceIcon = () => {
    switch (currentLead.device_type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado com sucesso!`);
    } catch (error) {
      toast.error('Erro ao copiar para a área de transferência');
    }
  };

  const CopyableField = ({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) => (
    <div className="flex items-center justify-between bg-muted/30 rounded p-3">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {icon}
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-sm font-medium truncate" title={value}>
            {value || '—'}
          </p>
        </div>
      </div>
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-8 w-8 p-0 hover:bg-background/50"
          onClick={() => copyToClipboard(value, label)}
          aria-label={`Copiar ${label}`}
        >
          <Copy className="h-3 w-3" />
        </Button>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Adicionar Novo Lead' : 'Editar Lead'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'add'
              ? 'Preencha os detalhes para adicionar um novo lead.'
              : 'Atualize os detalhes do lead.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              value={currentLead.name || ''}
              onChange={onInputChange}
              placeholder="Nome do lead"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Telefone</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none">
                +55
              </div>
              <Input
                id="phone"
                name="phone"
                value={currentLead.phone || ''}
                onChange={onPhoneChange}
                placeholder="(85) 99999-9999 ou (85) 9999-9999"
                className="pl-12"
                maxLength={16}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o DDD e número (8 ou 9 dígitos). Ex: 85998372658 ou 8598372658
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="campaign">Campanha</Label>
            <Select 
              value={currentLead.campaign || ''} 
              onValueChange={(value) => onSelectChange('campaign', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma campanha" />
              </SelectTrigger>
              <SelectContent>
                {campaigns.map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.name}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={currentLead.status || ''} 
              onValueChange={(value) => onSelectChange('status', value as Lead['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Novo</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="to_recover">A recuperar</SelectItem>
                <SelectItem value="contacted">Contactado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {mode === 'edit' && currentLead.last_message && (
            <div className="grid gap-2">
              <Label htmlFor="last_message">Última Mensagem (Somente Leitura)</Label>
              <Textarea
                id="last_message"
                value={currentLead.last_message}
                readOnly
                className="bg-muted/50 resize-none"
                rows={2}
              />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="first_contact_date">Data do Primeiro Contato</Label>
            <Input
              id="first_contact_date"
              name="first_contact_date"
              type="datetime-local"
              value={currentLead.first_contact_date ? new Date(currentLead.first_contact_date).toISOString().slice(0, 16) : ''}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_contact_date">Data do Último Contato</Label>
            <Input
              id="last_contact_date"
              name="last_contact_date"
              type="datetime-local"
              value={currentLead.last_contact_date ? new Date(currentLead.last_contact_date).toISOString().slice(0, 16) : ''}
              onChange={onInputChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              value={currentLead.notes || ''}
              onChange={onInputChange}
              placeholder="Observações sobre o lead"
            />
          </div>

          {mode === 'edit' && (
            <>
              <Separator className="my-6" />
              
              {/* Seção de Informações Técnicas */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Globe className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Informações Técnicas</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CopyableField
                    label="Navegador"
                    value={currentLead.browser || ''}
                    icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Sistema Operacional"
                    value={currentLead.os || ''}
                    icon={<Monitor className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Tipo de Dispositivo"
                    value={currentLead.device_type || ''}
                    icon={getDeviceIcon()}
                  />
                  
                  <CopyableField
                    label="Modelo do Dispositivo"
                    value={currentLead.device_model || ''}
                    icon={<Smartphone className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Endereço IP"
                    value={currentLead.ip_address || ''}
                    icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Localização"
                    value={currentLead.location || ''}
                    icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Resolução da Tela"
                    value={currentLead.screen_resolution || ''}
                    icon={<Monitor className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Fuso Horário"
                    value={currentLead.timezone || ''}
                    icon={<Clock className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Idioma"
                    value={currentLead.language || ''}
                    icon={<Globe className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Cidade"
                    value={currentLead.city || ''}
                    icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>
              </div>

              <Separator className="my-6" />
              
              {/* Seção de Parâmetros de Campanha */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Parâmetros de Campanha</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CopyableField
                    label="UTM Source"
                    value={currentLead.utm_source || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="UTM Medium"
                    value={currentLead.utm_medium || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="UTM Campaign"
                    value={currentLead.utm_campaign || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="UTM Content"
                    value={currentLead.utm_content || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="UTM Term"
                    value={currentLead.utm_term || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Facebook Campaign ID"
                    value={currentLead.facebook_campaign_id || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Facebook AdSet ID"
                    value={currentLead.facebook_adset_id || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Facebook Ad ID"
                    value={currentLead.facebook_ad_id || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="CTWA Click ID"
                    value={currentLead.ctwa_clid || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                  
                  <CopyableField
                    label="Source ID"
                    value={currentLead.source_id || ''}
                    icon={<Link className="w-4 h-4 text-muted-foreground" />}
                  />
                </div>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave}>
            {mode === 'add' ? 'Adicionar' : 'Atualizar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDialog;
