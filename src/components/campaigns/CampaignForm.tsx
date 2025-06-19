
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from 'lucide-react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Campaign } from '@/types';

interface CampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaignData: Omit<Campaign, 'id' | 'created_at'>) => void;
  campaign: Campaign | null;
}

const CampaignForm: React.FC<CampaignFormProps> = ({
  isOpen,
  onClose,
  onSave,
  campaign
}) => {
  const [uploading, setUploading] = useState(false);

  // Initialize form data with campaign or defaults
  const [formData, setFormData] = useState<Partial<Campaign>>(() => ({
    name: campaign?.name || '',
    company_title: campaign?.company_title || '',
    company_subtitle: campaign?.company_subtitle || '',
    logo_url: campaign?.logo_url || '',
    utm_source: campaign?.utm_source || '',
    utm_medium: campaign?.utm_medium || '',
    utm_campaign: campaign?.utm_campaign || '',
    utm_content: campaign?.utm_content || '',
    utm_term: campaign?.utm_term || '',
    whatsapp_number: campaign?.whatsapp_number || '',
    custom_message: campaign?.custom_message || '',
    event_type: campaign?.event_type || 'lead',
    redirect_type: campaign?.redirect_type || 'whatsapp',
    pixel_integration_type: campaign?.pixel_integration_type || 'direct',
    pixel_id: campaign?.pixel_id || '',
    facebook_access_token: campaign?.facebook_access_token || '',
    active: campaign?.active ?? true
  }));

  // Update form data when campaign changes
  React.useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        company_title: campaign.company_title || '',
        company_subtitle: campaign.company_subtitle || '',
        logo_url: campaign.logo_url || '',
        utm_source: campaign.utm_source || '',
        utm_medium: campaign.utm_medium || '',
        utm_campaign: campaign.utm_campaign || '',
        utm_content: campaign.utm_content || '',
        utm_term: campaign.utm_term || '',
        whatsapp_number: campaign.whatsapp_number || '',
        custom_message: campaign.custom_message || '',
        event_type: campaign.event_type || 'lead',
        redirect_type: campaign.redirect_type || 'whatsapp',
        pixel_integration_type: campaign.pixel_integration_type || 'direct',
        pixel_id: campaign.pixel_id || '',
        facebook_access_token: campaign.facebook_access_token || '',
        active: campaign.active ?? true
      });
    } else {
      // Reset form for new campaign
      setFormData({
        name: '',
        company_title: '',
        company_subtitle: '',
        logo_url: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_content: '',
        utm_term: '',
        whatsapp_number: '',
        custom_message: '',
        event_type: 'lead',
        redirect_type: 'whatsapp',
        pixel_integration_type: 'direct',
        pixel_id: '',
        facebook_access_token: '',
        active: true
      });
    }
  }, [campaign]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, active: checked }));
  };

  const handleEventTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, event_type: value as Campaign['event_type'] }));
  };

  const handleRedirectTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, redirect_type: value as Campaign['redirect_type'] }));
  };

  const handlePixelIntegrationTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, pixel_integration_type: value as Campaign['pixel_integration_type'] }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `campaign-logo-${Math.random()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: data.publicUrl
      }));

      toast.success('Logo enviada com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    if (!formData.name?.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }

    onSave(formData as Omit<Campaign, 'id' | 'created_at'>);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {campaign ? 'Editar Link de rastreamento' : 'Adicionar Novo Link de rastreamento'}
          </DialogTitle>
          <DialogDescription>
            {campaign 
              ? 'Atualize os detalhes do link de rastreamento e configurações de tracking.'
              : 'Configure seu link de rastreamento com tracking avançado e máximos parâmetros.'}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="integration">Integração</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* Identidade da Empresa */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Identidade da Empresa</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="company_title">Nome da empresa</Label>
                <Input
                  id="company_title"
                  name="company_title"
                  value={formData.company_title || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Minha Empresa"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="company_subtitle">Subtítulo</Label>
                <Input
                  id="company_subtitle"
                  name="company_subtitle"
                  value={formData.company_subtitle || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Sistema de Marketing Digital"
                />
              </div>

              <div className="grid gap-2">
                <Label>Logo (upload se aplicável)</Label>
                <div className="flex items-start space-x-4">
                  <div className="flex-1">
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={uploading}
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                    </Button>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: PNG, JPG, JPEG (máx. 5MB)
                    </p>
                  </div>
                  {formData.logo_url && (
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-lg border overflow-hidden">
                        <img
                          src={formData.logo_url}
                          alt="Logo da campanha"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Link de rastreamento*</Label>
              <Input
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                placeholder="Ex: Instagram - Stories Junho"
                required
              />
              <p className="text-xs text-muted-foreground">
                Este nome serve apenas como identificação interna do link de rastreamento.
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t">
              <Switch
                id="active"
                checked={formData.active || false}
                onCheckedChange={handleSwitchChange}
              />
              <Label htmlFor="active">Link de rastreamento Ativo</Label>
            </div>
          </TabsContent>

          {/* Integração e Link */}
          <TabsContent value="integration" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Integração e Link</h3>
              
              <div className="grid gap-2">
                <Label htmlFor="custom_message">Mensagem personalizada</Label>
                <Textarea
                  id="custom_message"
                  name="custom_message"
                  value={formData.custom_message || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: Olá! Vi seu interesse no nosso produto..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Essa mensagem será enviada automaticamente quando o lead clicar para conversar.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="event_type">Tipo de Evento</Label>
                <Select
                  value={formData.event_type || 'lead'}
                  onValueChange={handleEventTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contact">Contato</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="page_view">Visualização de Página</SelectItem>
                    <SelectItem value="sale">Venda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="whatsapp_number">Número do WhatsApp</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  value={formData.whatsapp_number || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 5511999887766"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="redirect_type">Tipo de redirecionamento</Label>
                <Select
                  value={formData.redirect_type || 'whatsapp'}
                  onValueChange={handleRedirectTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de redirecionamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">Direto para WhatsApp</SelectItem>
                    <SelectItem value="form">Formulário de Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pixel_id">ID do Facebook Pixel</Label>
                <Input
                  id="pixel_id"
                  name="pixel_id"
                  value={formData.pixel_id || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: 123456789012345"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="facebook_access_token">Facebook Access Token</Label>
                <Input
                  id="facebook_access_token"
                  name="facebook_access_token"
                  type="password"
                  value={formData.facebook_access_token || ''}
                  onChange={handleInputChange}
                  placeholder="Ex: EAABwzLixn..."
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="pixel_integration_type">Integração do Pixel</Label>
                <Select
                  value={formData.pixel_integration_type || 'direct'}
                  onValueChange={handlePixelIntegrationTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de integração" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direto</SelectItem>
                    <SelectItem value="form">Formulário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            {campaign ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CampaignForm;
