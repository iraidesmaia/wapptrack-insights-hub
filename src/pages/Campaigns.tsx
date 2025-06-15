
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '@/services/campaignService';
import { Campaign } from '@/types';
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
  const [customUtms, setCustomUtms] = useState({
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_content: "",
    utm_term: "",
  });
  // Mantém sempre aberto a seção UTMs customizadas
  const [showCustomUtm, setShowCustomUtm] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Seleciona automaticamente a primeira campanha assim que campanhas carregarem
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0]);
    }
  }, [campaigns, selectedCampaign]);

  // Sempre que seleciona uma campanha, preenche UTMs
  useEffect(() => {
    if (selectedCampaign) {
      setCustomUtms({
        utm_source: selectedCampaign.utm_source || "",
        utm_medium: selectedCampaign.utm_medium || "",
        utm_campaign: selectedCampaign.utm_campaign || "",
        utm_content: selectedCampaign.utm_content || "",
        utm_term: selectedCampaign.utm_term || "",
      });
    }
  }, [selectedCampaign]);

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
    const currentUrl = window.location.origin;
    return `${currentUrl}/ir?id=${campaign.id}`;
  };

  const getCustomUtmTrackingUrl = (campaign: Campaign, utms: Partial<Record<string, string>>) => {
    const currentUrl = window.location.origin;
    const params = new URLSearchParams();
    params.append("id", campaign.id);
    if (utms.utm_source) params.append("utm_source", utms.utm_source);
    if (utms.utm_medium) params.append("utm_medium", utms.utm_medium);
    if (utms.utm_campaign) params.append("utm_campaign", utms.utm_campaign);
    if (utms.utm_content) params.append("utm_content", utms.utm_content);
    if (utms.utm_term) params.append("utm_term", utms.utm_term);
    return `${currentUrl}/ir?${params.toString()}`;
  };

  const handleCopyTrackingUrl = (campaign: Campaign) => {
    copyToClipboard(getTrackingUrl(campaign), 'URL de rastreamento copiada');
  };

  // --- RENDER ---
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
        
        {/* BLOCO PARA VISUALIZAR LINK LIMPO E UTMs - SEMPRE VISÍVEL */}
        <div className="mt-2 bg-gray-50 border border-gray-200 rounded px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Dropdown de seleção de campanha */}
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Selecionar campanha:</label>
              <Select
                value={selectedCampaign?.id || ""}
                onValueChange={id => {
                  const c = campaigns.find(c => c.id === id);
                  setSelectedCampaign(c || null);
                }}
                disabled={campaigns.length === 0}
              >
                <SelectTrigger className="w-full sm:w-72">
                  <SelectValue placeholder="Selecione uma campanha..." />
                </SelectTrigger>
                <SelectContent className="z-[60] bg-white">
                  {campaigns.map(c => (
                    <SelectItem value={c.id} key={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Link limpo + copiar */}
            <div className="flex-1">
              <span className="font-semibold">Link de rastreamento limpo:</span>
              <div className="flex gap-2 mt-1">
                <input
                  className="w-full px-2 py-1 border rounded bg-gray-100 text-sm"
                  readOnly
                  value={selectedCampaign ? getTrackingUrl(selectedCampaign) : ""}
                />
                <Button
                  variant="outline"
                  disabled={!selectedCampaign}
                  onClick={() => selectedCampaign && handleCopyTrackingUrl(selectedCampaign)}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
          {/* UTMs customizadas: sempre visível */}
          <div className="mt-4">
            <span className="block font-medium mb-2">Gerar link com UTMs customizados:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input className="border px-2 py-1 rounded" placeholder="utm_source"
                value={customUtms.utm_source}
                onChange={e => setCustomUtms({ ...customUtms, utm_source: e.target.value })}
              />
              <input className="border px-2 py-1 rounded" placeholder="utm_medium"
                value={customUtms.utm_medium}
                onChange={e => setCustomUtms({ ...customUtms, utm_medium: e.target.value })}
              />
              <input className="border px-2 py-1 rounded" placeholder="utm_campaign"
                value={customUtms.utm_campaign}
                onChange={e => setCustomUtms({ ...customUtms, utm_campaign: e.target.value })}
              />
              <input className="border px-2 py-1 rounded" placeholder="utm_content"
                value={customUtms.utm_content}
                onChange={e => setCustomUtms({ ...customUtms, utm_content: e.target.value })}
              />
              <input className="border px-2 py-1 rounded" placeholder="utm_term"
                value={customUtms.utm_term}
                onChange={e => setCustomUtms({ ...customUtms, utm_term: e.target.value })}
              />
              <Button
                className="col-span-1 md:col-span-2"
                variant="outline"
                onClick={() => {
                  if (selectedCampaign) {
                    copyToClipboard(getCustomUtmTrackingUrl(selectedCampaign, customUtms), "Link com UTMs copiado");
                  }
                }}
                disabled={!selectedCampaign}
              >
                Copiar link com UTMs
              </Button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <CampaignFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
        />

        {/* Tabela de campanhas (ao clicar seleciona para exibir link limpo) */}
        <CampaignTable
          campaigns={filteredCampaigns}
          isLoading={isLoading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteCampaign}
          onCopyTrackingUrl={campaign => {
            setSelectedCampaign(campaign); // Selecionar para ver o link limpo acima
            handleCopyTrackingUrl(campaign);
          }}
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
