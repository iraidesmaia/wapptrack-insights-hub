
import { useState, useCallback } from 'react';
import { Lead } from '@/types';
import { addLead, updateLead, deleteLead } from '@/services/leadService';
import { toast } from 'sonner';

export const useLeadOperations = (
  leads: Lead[],
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>,
  activeProjectId?: string
) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddLead = useCallback(async (leadData: Omit<Lead, 'id'>) => {
    try {
      setIsLoading(true);
      console.log('💾 useLeadOperations - Adicionando lead para projeto:', activeProjectId);
      
      // 🎯 Passar o ID do projeto ativo
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

  return {
    handleAddLead,
    handleUpdateLead,
    handleDeleteLead,
    isLoading
  };
};
