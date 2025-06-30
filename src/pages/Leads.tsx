import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Lead } from '@/types';
import { getLeads, addLead, deleteLead, updateLead } from '@/services/leadService';
import LeadsTable from '@/components/leads/LeadsTable';
import LeadDetailDialog from '@/components/leads/LeadDetailDialog';
import LeadDialog from '@/components/leads/LeadDialog';
import { useToast } from "@/components/ui/use-toast"
import { formatBrazilianPhone } from '@/lib/phoneUtils';
import FacebookAdsDemoButton from '@/components/leads/FacebookAdsDemoButton';

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    handleRefresh();
  }, []);

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

  const handleSave = async (leadData: Omit<Lead, 'id' | 'created_at'>) => {
    try {
      const newLead = await addLead(leadData);
      setLeads([...leads, newLead]);
      setIsLeadDialogOpen(false);
      toast({
        title: "Lead criado com sucesso.",
      })
    } catch (error) {
      console.error("Error adding lead:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar lead.",
        description: "Ocorreu um problema ao criar o lead no servidor.",
      })
    }
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
        <div className="flex space-x-2">
          <FacebookAdsDemoButton onLeadCreated={handleRefresh} />
          <Button onClick={() => setIsLeadDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Lead
          </Button>
        </div>
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
        onClose={() => setIsLeadDialogOpen(false)}
        onSave={handleSave}
        lead={selectedLead || undefined}
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
  );
};

export default Leads;
