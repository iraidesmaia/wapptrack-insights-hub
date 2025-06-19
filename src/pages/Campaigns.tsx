
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCampaigns, addCampaign, updateCampaign, deleteCampaign } from '@/services/dataService';
import { Campaign } from '@/types';
import { Plus } from 'lucide-react';
import CampaignTable from '@/components/campaigns/CampaignTable';
import CampaignForm from '@/components/campaigns/CampaignForm';
import { toast } from "sonner";
import { useProject } from '@/context/ProjectContext';

const Campaigns = () => {
  const { activeProject } = useProject();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Campaigns - Buscando campanhas para projeto:', activeProject?.id);
      
      // 🎯 Passar o ID do projeto ativo para filtrar campanhas
      const campaignsData = await getCampaigns(activeProject?.id);
      
      console.log('✅ Campaigns - Campanhas carregadas:', {
        projectId: activeProject?.id,
        projectName: activeProject?.name,
        totalCampaigns: campaignsData.length
      });
      
      setCampaigns(campaignsData);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeProject?.id]); // 🎯 Recarregar quando o projeto ativo mudar

  const handleAddCampaign = () => {
    setEditingCampaign(null);
    setIsDialogOpen(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsDialogOpen(true);
  };

  const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'created_at'>) => {
    try {
      console.log('💾 Campaigns - Salvando campanha para projeto:', activeProject?.id);
      
      if (editingCampaign) {
        const updatedCampaign = await updateCampaign(editingCampaign.id, campaignData);
        setCampaigns(campaigns.map(c => c.id === updatedCampaign.id ? updatedCampaign : c));
        toast.success('Campanha atualizada com sucesso');
      } else {
        // 🎯 Passar o ID do projeto ativo ao criar nova campanha
        const newCampaign = await addCampaign(campaignData, activeProject?.id);
        setCampaigns([newCampaign, ...campaigns]);
        toast.success('Campanha criada com sucesso');
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
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success('Campanha excluída com sucesso');
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      campaign.name.toLowerCase().includes(searchLower) ||
      (campaign.utm_source && campaign.utm_source.toLowerCase().includes(searchLower)) ||
      (campaign.utm_medium && campaign.utm_medium.toLowerCase().includes(searchLower)) ||
      (campaign.utm_campaign && campaign.utm_campaign.toLowerCase().includes(searchLower))
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Campanhas</h1>
            <p className="text-muted-foreground">
              Gerencie suas campanhas de marketing
              {activeProject && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Projeto: {activeProject.name}
                </span>
              )}
            </p>
          </div>
          <Button onClick={handleAddCampaign}>
            <Plus className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar campanhas por nome, UTM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
        </div>

        <CampaignTable
          campaigns={filteredCampaigns}
          isLoading={isLoading}
          onEdit={handleEditCampaign}
          onDelete={handleDeleteCampaign}
        />

        <CampaignForm
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSave={handleSaveCampaign}
          campaign={editingCampaign}
        />
      </div>
    </MainLayout>
  );
};

export default Campaigns;
