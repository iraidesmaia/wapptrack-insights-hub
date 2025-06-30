import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Lead, Campaign } from '@/types';
import { getLeads, addLead, deleteLead, updateLead } from '@/services/leadService';
import { getCampaigns } from '@/services/campaignService';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDetailDialog from '@/components/leads/LeadDetailDialog';
import LeadDialog from '@/components/leads/LeadDialog';
import { useToast } from "@/components/ui/use-toast"
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import MainLayout from '@/components/MainLayout';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    campaign: '',
    status: 'new',
    notes: '',
    first_contact_date: '',
    last_contact_date: ''
  });
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    handleRefresh();
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const campaignsData = await getCampaigns();
      setCampaigns(campaignsData);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const leadsData = await getLeads();
      setLeads(leadsData);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar leads.",
        description: "Ocorreu um problema ao buscar os leads do servidor.",
      })
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  };

  const handleEdit = (lead: Lead) => {
    setSelectedLead(lead);
    setCurrentLead(lead);
    setDialogMode('edit');
    setIsLeadDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      setLeads(leads.filter(lead => lead.id !== id));
      toast({
        title: "Lead excluído com sucesso.",
      })
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir lead.",
        description: "Ocorreu um problema ao excluir o lead do servidor.",
      })
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead(prev => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setCurrentLead(prev => ({ ...prev, phone: formatted }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentLead(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      if (!currentLead.name || !currentLead.phone || !currentLead.campaign || !currentLead.status) {
        toast({
          variant: "destructive",
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
        });
        return;
      }

      if (dialogMode === 'add') {
        const newLead = await addLead(currentLead as Omit<Lead, 'id' | 'created_at'>);
        setLeads([...leads, newLead]);
        toast({
          title: "Lead criado com sucesso.",
        });
      } else {
        if (selectedLead) {
          const updatedLead = await updateLead(selectedLead.id, currentLead);
          setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
          toast({
            title: "Lead atualizado com sucesso.",
          });
        }
      }
      
      setIsLeadDialogOpen(false);
      resetCurrentLead();
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar lead.",
        description: "Ocorreu um problema ao salvar o lead no servidor.",
      });
    }
  };

  const resetCurrentLead = () => {
    setCurrentLead({
      name: '',
      phone: '',
      campaign: '',
      status: 'new',
      notes: '',
      first_contact_date: '',
      last_contact_date: ''
    });
    setSelectedLead(null);
  };

  const handleOpenAddDialog = () => {
    resetCurrentLead();
    setDialogMode('add');
    setIsLeadDialogOpen(true);
  };

  const handleUpdate = async (id: string, updatedData: Partial<Lead>) => {
    try {
      const updatedLead = await updateLead(id, updatedData);
      setLeads(leads.map(lead => lead.id === id ? updatedLead : lead));
      setIsDetailDialogOpen(false);
      toast({
        title: "Lead atualizado com sucesso.",
      })
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar lead.",
        description: "Ocorreu um problema ao atualizar o lead no servidor.",
      })
    }
  };

  const handleOpenWhatsApp = (phone: string) => {
    const formattedPhone = formatBrazilianPhone(phone);
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <Button onClick={handleOpenAddDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>

        <LeadsTable
          leads={leads}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onOpenWhatsApp={handleOpenWhatsApp}
          onRefresh={handleRefresh}
        />

        <LeadDialog
          isOpen={isLeadDialogOpen}
          onClose={() => {
            setIsLeadDialogOpen(false);
            resetCurrentLead();
          }}
          mode={dialogMode}
          currentLead={currentLead}
          campaigns={campaigns}
          onSave={handleSave}
          onInputChange={handleInputChange}
          onPhoneChange={handlePhoneChange}
          onSelectChange={handleSelectChange}
        />

        <LeadDetailDialog
          lead={selectedLead}
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          onSave={(updatedData: Partial<Lead>) => {
            if (selectedLead) {
              return handleUpdate(selectedLead.id, updatedData);
            }
            return Promise.resolve();
          }}
          onOpenWhatsApp={handleOpenWhatsApp}
        />
      </div>
    </MainLayout>
  );
};

export default Leads;
