
import React, { useEffect, useState } from 'react';
import MainLayout from '@/components/MainLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLeads, getCampaigns } from '@/services/dataService';
import { Lead, Campaign } from '@/types';
import { Plus, RefreshCw } from 'lucide-react';
import { usePhoneFixer } from '@/hooks/usePhoneFixer';
import { useLeadOperations } from '@/hooks/useLeadOperations';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDialog from '@/components/leads/LeadDialog';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const { fixPhoneNumbers, isLoading: isFixingPhones } = usePhoneFixer();
  const {
    isDialogOpen,
    setIsDialogOpen,
    dialogMode,
    currentLead,
    handleInputChange,
    handlePhoneChange,
    handleSelectChange,
    handleOpenAddDialog,
    handleOpenEditDialog,
    handleSaveLead,
    handleDeleteLead,
    openWhatsApp
  } = useLeadOperations(leads, setLeads);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [leadsData, campaignsData] = await Promise.all([
          getLeads(),
          getCampaigns()
        ]);
        setLeads(leadsData);
        setCampaigns(campaignsData);
      } catch (error) {
        console.error('Error fetching leads data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFixPhoneNumbers = async () => {
    try {
      const updatedLeads = await fixPhoneNumbers();
      setLeads(updatedLeads);
    } catch (error) {
      console.error('Error fixing phone numbers:', error);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      lead.name.toLowerCase().includes(searchLower) ||
      lead.phone.toLowerCase().includes(searchLower) ||
      lead.campaign.toLowerCase().includes(searchLower) ||
      lead.status.toLowerCase().includes(searchLower) ||
      (lead.last_message && lead.last_message.toLowerCase().includes(searchLower))
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground">Gerencie todos os seus leads de WhatsApp</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleFixPhoneNumbers}
              disabled={isFixingPhones}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Corrigir Números
            </Button>
            <Button onClick={handleOpenAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Novo Lead
            </Button>
          </div>
        </div>

        <div className="flex items-center">
          <Input
            placeholder="Buscar leads por nome, telefone, campanha, status ou mensagem..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-lg"
          />
        </div>

        <LeadsTable
          leads={filteredLeads}
          isLoading={isLoading}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteLead}
          onOpenWhatsApp={openWhatsApp}
        />

        <LeadDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          mode={dialogMode}
          currentLead={currentLead}
          campaigns={campaigns}
          onSave={handleSaveLead}
          onInputChange={handleInputChange}
          onPhoneChange={handlePhoneChange}
          onSelectChange={handleSelectChange}
        />
      </div>
    </MainLayout>
  );
};

export default Leads;
