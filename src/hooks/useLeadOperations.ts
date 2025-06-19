
import { useState, useCallback } from 'react';
import { Lead } from '@/types';
import { addLead, updateLead, deleteLead } from '@/services/leadService';
import { toast } from 'sonner';
import { formatBrazilianPhone } from '@/lib/phoneUtils';

export const useLeadOperations = (
  leads: Lead[],
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>,
  activeProjectId?: string
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({});
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleAddLead = useCallback(async (leadData: Omit<Lead, 'id'>) => {
    try {
      setIsLoading(true);
      console.log('💾 useLeadOperations - Adicionando lead para projeto:', activeProjectId);
      
      const newLead = await addLead(leadData, activeProjectId);
      
      setLeads(prevLeads => [newLead, ...prevLeads]);
      toast.success('Lead adicionado com sucesso!');
      
      console.log('✅ useLeadOperations - Lead adicionado:', newLead);
    } catch (error) {
      console.error('❌ useLeadOperations - Erro ao adicionar lead:', error);
      toast.error('Erro ao adicionar lead');
    } finally {
      setIsLoading(false);
    }
  }, [setLeads, activeProjectId]);

  const handleUpdateLead = useCallback(async (id: string, leadData: Partial<Lead>) => {
    try {
      setIsLoading(true);
      const updatedLead = await updateLead(id, leadData);
      
      setLeads(prevLeads => 
        prevLeads.map(lead => 
          lead.id === id ? updatedLead : lead
        )
      );
      
      toast.success('Lead atualizado com sucesso!');
    } catch (error) {
      console.error('❌ useLeadOperations - Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead');
    } finally {
      setIsLoading(false);
    }
  }, [setLeads]);

  const handleDeleteLead = useCallback(async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      setIsLoading(true);
      await deleteLead(id);
      
      setLeads(prevLeads => prevLeads.filter(lead => lead.id !== id));
      toast.success('Lead excluído com sucesso!');
    } catch (error) {
      console.error('❌ useLeadOperations - Erro ao excluir lead:', error);
      toast.error('Erro ao excluir lead');
    } finally {
      setIsLoading(false);
    }
  }, [setLeads]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedPhone = formatBrazilianPhone(e.target.value);
    setCurrentLead(prev => ({ ...prev, phone: formattedPhone }));
  }, []);

  const handleSelectChange = useCallback((name: string, value: string) => {
    setCurrentLead(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleOpenAddDialog = useCallback(() => {
    setCurrentLead({
      name: '',
      phone: '',
      campaign: '',
      status: 'new',
      notes: '',
      first_contact_date: '',
      last_contact_date: ''
    });
    setDialogMode('add');
    setIsDialogOpen(true);
  }, []);

  const handleOpenEditDialog = useCallback((lead: Lead) => {
    setCurrentLead(lead);
    setDialogMode('edit');
    setIsDialogOpen(true);
  }, []);

  const handleOpenViewDialog = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  }, []);

  const handleSaveLead = useCallback(async () => {
    if (!currentLead.name || !currentLead.phone || !currentLead.campaign) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (dialogMode === 'add') {
        await handleAddLead(currentLead as Omit<Lead, 'id'>);
      } else {
        await handleUpdateLead(currentLead.id!, currentLead);
      }
      setIsDialogOpen(false);
      setCurrentLead({});
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
    }
  }, [currentLead, dialogMode, handleAddLead, handleUpdateLead]);

  const handleSaveFromDetailDialog = useCallback(async (updatedData: Partial<Lead>) => {
    if (!selectedLead) return;
    
    try {
      await handleUpdateLead(selectedLead.id, updatedData);
      setSelectedLead(prev => prev ? { ...prev, ...updatedData } : null);
    } catch (error) {
      console.error('Erro ao salvar do dialog de detalhes:', error);
    }
  }, [selectedLead, handleUpdateLead]);

  const openWhatsApp = useCallback((phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/55${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
  }, []);

  return {
    handleAddLead,
    handleUpdateLead,
    handleDeleteLead,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    isDetailDialogOpen,
    setIsDetailDialogOpen,
    dialogMode,
    currentLead,
    selectedLead,
    handleInputChange,
    handlePhoneChange,
    handleSelectChange,
    handleOpenAddDialog,
    handleOpenEditDialog,
    handleOpenViewDialog,
    handleSaveLead,
    handleSaveFromDetailDialog,
    openWhatsApp
  };
};
