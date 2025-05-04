import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '@/services/dataService';
import { Campaign } from '@/types';
import { buildUtmUrl, formatDate, generateTrackingUrl } from '@/lib/utils';
import { Plus, Trash2, Edit, Copy, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentCampaign, setCurrentCampaign] = useState<Partial<Campaign>>({
    name: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    utmTerm: '',
    pixel: '',
    whatsappNumber: '',
    eventType: 'lead',
    active: true
  });
  const [baseUrl, setBaseUrl] = useState('https://seusite.com');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const campaignsData = await getCampaigns();
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching campaigns data:', error);
        toast.error('Erro ao carregar campanhas');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(searchLower) ||
      (campaign.utmSource && campaign.utmSource.toLowerCase().includes(searchLower)) ||
      (campaign.utmMedium && campaign.utmMedium.toLowerCase().includes(searchLower)) ||
      (campaign.utmCampaign && campaign.utmCampaign.toLowerCase().includes(searchLower))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCampaign({ ...currentCampaign, [name]: value });
  };

  const handleSwitchChange = (checked: boolean) => {
    setCurrentCampaign({ ...currentCampaign, active: checked });
  };

  const handleEventTypeChange = (value: string) => {
    setCurrentCampaign({ ...currentCampaign, eventType: value as Campaign['eventType'] });
  };

  const handleOpenAddDialog = () => {
    setCurrentCampaign({
      name: '',
      utmSource: '',
      utmMedium: '',
      utmCampaign: '',
      utmContent: '',
      utmTerm: '',
      pixel: '',
      whatsappNumber: '',
      eventType: 'lead',
      active: true
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (campaign: Campaign) => {
    setCurrentCampaign({ ...campaign });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleSaveCampaign = async () => {
    try {
      // Validate required fields
      if (!currentCampaign.name) {
        toast.error('O nome da campanha é obrigatório');
        return;
      }

      if (dialogMode === 'add') {
        const newCampaign = await addCampaign(currentCampaign as Omit<Campaign, 'id' | 'createdAt'>);
        setCampaigns([...campaigns, newCampaign]);
        toast.success('Campanha adicionada com sucesso');
      } else {
        if (!currentCampaign.id) return;
        const updatedCampaign = await updateCampaign(currentCampaign.id, currentCampaign);
        setCampaigns(campaigns.map(campaign => campaign.id === updatedCampaign.id ? updatedCampaign : campaign));
        toast.success('Campanha atualizada com sucesso');
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Erro ao salvar campanha');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      return;
    }

    try {
      await deleteCampaign(id);
      setCampaigns(campaigns.filter(campaign => campaign.id !== id));
      toast.success('Campanha excluída com sucesso');
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      toast.error(error.message || 'Erro ao excluir campanha');
    }
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast.success(message))
      .catch(err => {
        console.error('Error copying text: ', err);
        toast.error('Erro ao copiar para o clipboard');
      });
  };

  const getUtmUrl = (campaign: Campaign) => {
    return buildUtmUrl(
      baseUrl,
      campaign.utmSource,
      campaign.utmMedium,
      campaign.utmCampaign,
      campaign.utmContent,
      campaign.utmTerm
    );
  };

  const getTrackingUrl = (campaign: Campaign) => {
    // In a real app, this would use the actual hostname
    const currentUrl = window.location.origin;
    return `${currentUrl}/ir?id=${campaign.id}`;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">Crie e gerencie campanhas de marketing</p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar campanhas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="table-wrapper overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-medium">Nome</th>
                    <th className="p-4 text-left font-medium">Origem</th>
                    <th className="p-4 text-left font-medium">Meio</th>
                    <th className="p-4 text-left font-medium">Status</th>
                    <th className="p-4 text-left font-medium">Data</th>
                    <th className="p-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Carregando campanhas...
                      </td>
                    </tr>
                  ) : filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center">
                        Nenhuma campanha encontrada
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b">
                        <td className="p-4">{campaign.name}</td>
                        <td className="p-4">{campaign.utmSource || '-'}</td>
                        <td className="p-4">{campaign.utmMedium || '-'}</td>
                        <td className="p-4">
                          {campaign.active ? (
                            <Badge variant="default" className="bg-primary">Ativa</Badge>
                          ) : (
                            <Badge variant="secondary">Inativa</Badge>
                          )}
                        </td>
                        <td className="p-4">{formatDate(campaign.createdAt)}</td>
                        <td className="p-4 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(getTrackingUrl(campaign), 'URL de rastreamento copiada')}
                            title="Copiar URL"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(campaign)}
                            title="Editar campanha"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            title="Excluir campanha"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {dialogMode === 'add' ? 'Adicionar Nova Campanha' : 'Editar Campanha'}
              </DialogTitle>
              <DialogDescription>
                {dialogMode === 'add' 
                  ? 'Preencha os detalhes para adicionar uma nova campanha.' 
                  : 'Atualize os detalhes da campanha.'}
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="basic">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="advanced">Avançado</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nome da Campanha*</Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentCampaign.name}
                    onChange={handleInputChange}
                    placeholder="Ex: Instagram - Stories Junho"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="utmSource">Origem (utm_source)</Label>
                  <Input
                    id="utmSource"
                    name="utmSource"
                    value={currentCampaign.utmSource}
                    onChange={handleInputChange}
                    placeholder="Ex: instagram"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="utmMedium">Meio (utm_medium)</Label>
                  <Input
                    id="utmMedium"
                    name="utmMedium"
                    value={currentCampaign.utmMedium}
                    onChange={handleInputChange}
                    placeholder="Ex: social"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="utmCampaign">Nome da Campanha (utm_campaign)</Label>
                  <Input
                    id="utmCampaign"
                    name="utmCampaign"
                    value={currentCampaign.utmCampaign}
                    onChange={handleInputChange}
                    placeholder="Ex: promo_junho"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={currentCampaign.active}
                    onCheckedChange={handleSwitchChange}
                  />
                  <Label htmlFor="active">Ativa</Label>
                </div>
              </TabsContent>
              <TabsContent value="advanced" className="space-y-4 mt-4">
                <div className="grid gap-2">
                  <Label htmlFor="utmContent">Conteúdo (utm_content)</Label>
                  <Input
                    id="utmContent"
                    name="utmContent"
                    value={currentCampaign.utmContent}
                    onChange={handleInputChange}
                    placeholder="Ex: banner_top"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="utmTerm">Termos (utm_term)</Label>
                  <Input
                    id="utmTerm"
                    name="utmTerm"
                    value={currentCampaign.utmTerm}
                    onChange={handleInputChange}
                    placeholder="Ex: marketing,whatsapp"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    name="whatsappNumber"
                    value={currentCampaign.whatsappNumber}
                    onChange={handleInputChange}
                    placeholder="Ex: 5511999887766"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe o número que receberá as mensagens (formato internacional, sem espaços ou símbolos)
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="eventType">Tipo de Evento</Label>
                  <Select
                    value={currentCampaign.eventType || 'lead'}
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
                  <p className="text-xs text-muted-foreground">
                    Define como o contato será registrado no sistema e como o Pixel será disparado
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pixelId">ID do Facebook Pixel</Label>
                  <Input
                    id="pixelId"
                    name="pixelId"
                    value={currentCampaign.pixelId}
                    onChange={handleInputChange}
                    placeholder="Ex: 123456789012345"
                  />
                  <p className="text-xs text-muted-foreground">
                    Informe o ID do seu Facebook Pixel para rastreamento automático de eventos
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="baseUrl">URL Base</Label>
                  <Input
                    id="baseUrl"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://seusite.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL base usada para construir links UTM
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveCampaign}>
                {dialogMode === 'add' ? 'Adicionar' : 'Atualizar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Campaigns;
