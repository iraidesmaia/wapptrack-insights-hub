import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '@/services/campaignService';
import { Campaign } from '@/types';
import { buildUtmUrl, generateTrackingUrl } from '@/lib/utils';
import { Plus, Tags } from 'lucide-react';
import { toast } from "sonner";
import GlobalKeywordsSettings from '@/components/campaigns/GlobalKeywordsSettings';
import CampaignForm from '@/components/campaigns/CampaignForm';
import CampaignTable from '@/components/campaigns/CampaignTable';
import CampaignFilters from '@/components/campaigns/CampaignFilters';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentCampaign, setCurrentCampaign] = useState<Partial<Campaign>>({
    name: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: '',
    pixel_id: '',
    facebook_access_token: '',
    whatsapp_number: '',
    event_type: 'lead',
    active: true,
    custom_message: '',
    company_title: '',
    company_subtitle: '',
    redirect_type: 'whatsapp',
    pixel_integration_type: 'direct',
    conversion_api_enabled: true,
    advanced_matching_enabled: true,
    server_side_api_enabled: true,
    test_event_code: '',
    custom_audience_pixel_id: '',
    tracking_domain: '',
    external_id: '',
    data_processing_options: [],
    data_processing_options_country: 0,
    data_processing_options_state: 0
  });
  const [baseUrl, setBaseUrl] = useState('https://seusite.com');
  const [isGlobalKeywordsOpen, setIsGlobalKeywordsOpen] = useState(false);

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
      (campaign.utm_source && campaign.utm_source.toLowerCase().includes(searchLower)) ||
      (campaign.utm_medium && campaign.utm_medium.toLowerCase().includes(searchLower)) ||
      (campaign.utm_campaign && campaign.utm_campaign.toLowerCase().includes(searchLower))
    );
  });

  const handleOpenAddDialog = () => {
    setCurrentCampaign({
      name: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      pixel_id: '',
      facebook_access_token: '',
      whatsapp_number: '',
      event_type: 'lead',
      active: true,
      custom_message: '',
      company_title: '',
      company_subtitle: '',
      redirect_type: 'whatsapp',
      pixel_integration_type: 'direct',
      conversion_api_enabled: true,
      advanced_matching_enabled: true,
      server_side_api_enabled: true,
      test_event_code: '',
      custom_audience_pixel_id: '',
      tracking_domain: '',
      external_id: '',
      data_processing_options: [],
      data_processing_options_country: 0,
      data_processing_options_state: 0
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
        const newCampaign = await addCampaign(currentCampaign as Omit<Campaign, 'id' | 'created_at'>);
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

  const getTrackingUrl = (campaign: Campaign) => {
    // Gera todos os UTMs no link automaticamente:
    // utm_source: "campanha_web", utm_medium: "digital", utm_campaign: nome da campanha (slug), utm_content: "link", utm_term: "padrao"
    const currentUrl = window.location.origin;
    const utm_source = "campanha_web";
    const utm_medium = "digital";
    const utm_campaign = (campaign.name || '').replace(/\s+/g, '-').toLowerCase();
    const utm_content = "link";
    const utm_term = "padrao";
    return `${currentUrl}/ir?id=${campaign.id}&utm_source=${utm_source}&utm_medium=${utm_medium}&utm_campaign=${utm_campaign}&utm_content=${utm_content}&utm_term=${utm_term}`;
  };

  const handleCopyTrackingUrl = (campaign: Campaign) => {
    copyToClipboard(getTrackingUrl(campaign), 'URL de rastreamento copiada');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">Crie e gerencie campanhas com tracking avançado e máximos parâmetros</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsGlobalKeywordsOpen(true)}
              title="Configurações de Tags Globais"
            >
              <Tags className="mr-2 h-4 w-4" /> Configurar Tags
            </Button>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Nova Campanha
            </Button>
          </div>
        </div>

        <CampaignFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        <CampaignTable
          campaigns={filteredCampaigns}
          isLoading={isLoading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteCampaign}
          onCopyTrackingUrl={handleCopyTrackingUrl}
        />

        <CampaignForm
          isOpen={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          mode={dialogMode}
          campaign={currentCampaign}
          onCampaignChange={setCurrentCampaign}
          onSave={handleSaveCampaign}
          baseUrl={baseUrl}
          onBaseUrlChange={setBaseUrl}
        />

        <GlobalKeywordsSettings 
          open={isGlobalKeywordsOpen}
          onOpenChange={setIsGlobalKeywordsOpen}
        />
      </div>
    </MainLayout>
  );
};

export default Campaigns;
