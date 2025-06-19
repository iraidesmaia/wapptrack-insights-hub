
import { useState } from 'react';
import { Lead, Campaign } from '@/types';
import { addLead, updateLead, deleteLead, addSale } from '@/services/dataService';
import { formatBrazilianPhone, processBrazilianPhone, validateBrazilianPhone } from '@/lib/phoneUtils';
import { correctPhoneNumber, shouldCorrectPhone } from '@/lib/phoneCorrection';
import { toast } from "sonner";
import { useProject } from '@/context/ProjectContext';

export const useLeadOperations = (leads: Lead[], setLeads: React.Dispatch<React.SetStateAction<Lead[]>>) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({
    name: '',
    phone: '',
    campaign: '',
    status: 'new',
    notes: '',
    first_contact_date: '',
    last_contact_date: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    utm_content: '',
    utm_term: ''
  });

  const { currentProject } = useProject();

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
      last_contact_date: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: ''
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
    
    setCurrentLead({
      ...lead,
      phone: displayPhone,
      utm_source: lead.utm_source || '',
      utm_medium: lead.utm_medium || '',
      utm_campaign: lead.utm_campaign || '',
      utm_content: lead.utm_content || '',
      utm_term: lead.utm_term || ''
    });
    setDialogMode('edit');
    setIsDialogOpen(true);
  };

  const handleOpenViewDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDetailDialogOpen(true);
  };

  const handleSaveFromDetailDialog = async (updatedData: Partial<Lead>) => {
    if (!selectedLead) return;

    try {
      const updatedLead = await updateLead(selectedLead.id, updatedData);
      setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
      setSelectedLead(updatedLead);
      toast.success('Lead atualizado com sucesso');
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Erro ao atualizar lead');
    }
  };

  const createSaleFromLead = async (lead: Lead) => {
    if (!currentProject) {
      toast.error('Projeto não selecionado');
      return;
    }

    try {
      console.log('🎯 createSaleFromLead - Iniciando criação de venda para lead:', {
        leadId: lead.id,
        leadName: lead.name,
        campaign: lead.campaign,
        status: lead.status,
        projectId: currentProject.id
      });

      const newSale = await addSale({
        value: 0,
        date: new Date().toISOString(),
        lead_id: lead.id,
        lead_name: lead.name,
        campaign: lead.campaign,
        product: '',
        notes: `Venda criada automaticamente quando lead foi convertido`,
        project_id: currentProject.id
      });
      
      console.log('✅ createSaleFromLead - Venda criada com sucesso:', newSale);
      toast.success('Lead convertido! Uma nova venda foi criada automaticamente.');
      
      return newSale;
    } catch (error) {
      console.error('❌ createSaleFromLead - Erro detalhado ao criar venda automática:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        leadData: {
          id: lead.id,
          name: lead.name,
          campaign: lead.campaign
        }
      });
      toast.error('Lead atualizado, mas houve erro ao criar a venda automática. Verifique o console para mais detalhes.');
      throw error;
    }
  };

  const handleSaveLead = async () => {
    if (!currentProject) {
      toast.error('Projeto não selecionado');
      return;
    }

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

      console.log('💾 handleSaveLead - Dados do lead:', {
        mode: dialogMode,
        leadId: currentLead.id,
        currentStatus: currentLead.status,
        wasConverted,
        projectId: currentProject.id
      });

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
        console.log('➕ handleSaveLead - Adicionando novo lead...');
        const newLead = await addLead({
          ...leadToSave as Omit<Lead, 'id' | 'created_at'>,
          project_id: currentProject.id
        });
        setLeads([newLead, ...leads]);
        updatedLead = newLead;
        toast.success('Lead adicionado com sucesso');

        // Verificar se novo lead já foi criado como convertido
        if (wasConverted) {
          console.log('🎯 handleSaveLead - Novo lead criado como convertido, criando venda...');
          try {
            await createSaleFromLead(updatedLead);
          } catch (saleError) {
            console.error('❌ handleSaveLead - Erro ao criar venda para novo lead convertido:', saleError);
          }
        }
      } else {
        if (!currentLead.id) {
          console.error('❌ handleSaveLead - ID do lead não encontrado para edição');
          return;
        }
        
        const originalLead = leads.find(lead => lead.id === currentLead.id);
        const statusChangedToConverted = originalLead?.status !== 'converted' && currentLead.status === 'converted';
        
        console.log('📝 handleSaveLead - Editando lead existente:', {
          leadId: currentLead.id,
          originalStatus: originalLead?.status,
          newStatus: currentLead.status,
          statusChangedToConverted
        });
        
        updatedLead = await updateLead(currentLead.id, leadToSave);
        setLeads(leads.map(lead => lead.id === updatedLead.id ? updatedLead : lead));
        toast.success('Lead atualizado com sucesso');
        
        // Verificar se o status mudou para convertido
        if (statusChangedToConverted) {
          console.log('🎯 handleSaveLead - Status mudou para convertido, criando venda...');
          try {
            await createSaleFromLead(updatedLead);
          } catch (saleError) {
            console.error('❌ handleSaveLead - Erro ao criar venda após conversão:', saleError);
          }
        } else {
          console.log('⏭️ handleSaveLead - Status não mudou para convertido, pulando criação de venda');
        }
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('❌ handleSaveLead - Erro geral ao salvar lead:', error);
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
    handleDeleteLead,
    openWhatsApp
  };
};
