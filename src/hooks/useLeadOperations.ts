
import { useState } from 'react';
import { Lead, Campaign } from '@/types';
import { addLead, updateLead, deleteLead, addSale } from '@/services/dataService';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone } from '@/lib/phoneUtils';
import { correctPhoneNumber, shouldCorrectPhone } from '@/lib/phoneCorrection';
import { toast } from "sonner";

export const useLeadOperations = (leads: Lead[], setLeads: React.Dispatch<React.SetStateAction<Lead[]>>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    campaign: '',
    status: 'new',
    notes: '',
    first_contact_date: '',
    last_contact_date: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatBrazilianPhone(value);
    setCurrentLead({ ...currentLead, phone: formatted });
  };

  const handleSelectChange = (name: string, value: string) => {
    setCurrentLead({ ...currentLead, [name]: value });
  };

  const handleOpenAddDialog = () => {
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
  };

  const handleOpenEditDialog = (lead: Lead) => {
    let displayPhone = lead.phone;
    if (lead.phone.startsWith('55')) {
      const phoneWithoutCountryCode = lead.phone.slice(2);
      displayPhone = formatBrazilianPhone(phoneWithoutCountryCode);
    }
    
    setCurrentLead({ ...lead, phone: displayPhone });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const createSaleFromLead = async (lead: Lead) => {
    try {
      const newSale = await addSale({
        value: 0,
        date: new Date().toISOString(),
        lead_id: lead.id,
        lead_name: lead.name,
        campaign: lead.campaign,
        product: '',
        notes: `Venda criada automaticamente quando lead foi convertido`
      });
      
      console.log('Venda criada automaticamente:', newSale);
      toast.success('Lead convertido! Uma nova venda foi criada automaticamente.');
    } catch (error) {
      console.error('Erro ao criar venda automática:', error);
      toast.error('Lead atualizado, mas houve erro ao criar a venda automática');
    }
  };

  const handleSaveLead = async () => {
    try {
      if (!currentLead.name || !currentLead.phone || !currentLead.campaign || !currentLead.status) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      if (!validateBrazilianPhone(currentLead.phone)) {
        toast.error('Por favor, informe um número válido (DDD + 8 ou 9 dígitos)');
        return;
      }

      let updatedLead: Lead;
      const wasConverted = currentLead.status === 'converted';

      let processedPhone = processBrazilianPhone(currentLead.phone);
      
      // Aplicar correção automática se necessário
      if (shouldCorrectPhone(processedPhone)) {
        const originalPhone = processedPhone;
        processedPhone = correctPhoneNumber(processedPhone);
        console.log(`Número corrigido automaticamente: ${originalPhone} → ${processedPhone}`);
        toast.info(`Número corrigido automaticamente: ${originalPhone} → ${processedPhone}`);
      }

      const leadToSave = { ...currentLead, phone: processedPhone };

      if (dialogMode === 'add') {
        const newLead = await addLead(leadToSave as Omit<Lead, 'id' | 'created_at'>);
        setLeads([newLead, ...leads]);
        updatedLead = newLead;
        toast.success('Lead adicionado com sucesso');
      } else {
        if (!currentLead.id) return;
        
        const originalLead = leads.find(lead => lead.id === currentLead.id);
        const statusChangedToConverted = originalLead?.status !== 'converted' && currentLead.status === 'converted';
        
        updatedLead = await updateLead(currentLead.id, leadToSave);
        setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead atualizado com sucesso');
        
        if (statusChangedToConverted) {
          await createSaleFromLead(updatedLead);
        }
      }

      if (dialogMode === 'add' && wasConverted) {
        await createSaleFromLead(updatedLead);
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast.error('Erro ao salvar lead');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este lead?')) {
      return;
    }

    try {
      await deleteLead(id);
      setLeads(leads.filter(lead => lead.id !== id));
      toast.success('Lead excluído com sucesso');
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Erro ao excluir lead');
    }
  };

  const openWhatsApp = (phone: string) => {
    const formattedPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${formattedPhone}`, '_blank');
  };

  return {
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
  };
};
