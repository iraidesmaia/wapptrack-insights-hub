
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionCredentials {
  id: string;
  user_id: string;
  api_url: string;
  api_key: string;
  instance_name?: string | null;
  status: string;
  validated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export const useEvolutionCredentials = () => {
  const [credentials, setCredentials] = useState<EvolutionCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [formData, setFormData] = useState({
    api_url: 'https://www.evolutionapi.workidigital.tech',
    api_key: '',
    instance_name: ''
  });

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('evolution_credentials')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar credenciais:', error);
        return;
      }

      if (data) {
        setCredentials(data);
        setFormData({
          api_url: data.api_url || 'https://www.evolutionapi.workidigital.tech',
          api_key: data.api_key || '',
          instance_name: data.instance_name || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateCredentials = async () => {
    if (!formData.api_url || !formData.api_key) {
      toast.error('URL da API e chave são obrigatórios');
      return false;
    }

    try {
      setValidating(true);
      
      const { data, error } = await supabase.functions.invoke('validate-evolution-credentials', {
        body: {
          api_url: formData.api_url,
          api_key: formData.api_key
        }
      });

      if (error) {
        console.error('Erro na validação:', error);
        toast.error('Erro ao validar credenciais: ' + error.message);
        return false;
      }

      if (data?.success) {
        toast.success('Credenciais válidas!');
        return true;
      } else {
        toast.error(data?.error || 'Credenciais inválidas');
        return false;
      }
    } catch (error: any) {
      console.error('Erro ao validar credenciais:', error);
      toast.error('Erro ao validar credenciais: ' + error.message);
      return false;
    } finally {
      setValidating(false);
    }
  };

  const saveCredentials = async () => {
    if (!formData.api_url || !formData.api_key) {
      toast.error('URL da API e chave são obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Validar antes de salvar
      const isValid = await validateCredentials();
      if (!isValid) return;

      const credentialsData = {
        user_id: user.id,
        api_url: formData.api_url,
        api_key: formData.api_key,
        instance_name: formData.instance_name || null,
        status: 'valid' as const,
        validated_at: new Date().toISOString()
      };

      let result;
      if (credentials?.id) {
        // Atualizar credenciais existentes
        result = await supabase
          .from('evolution_credentials')
          .update(credentialsData)
          .eq('id', credentials.id)
          .select()
          .single();
      } else {
        // Criar novas credenciais
        result = await supabase
          .from('evolution_credentials')
          .insert([credentialsData])
          .select()
          .single();
      }

      if (result.error) {
        console.error('Erro ao salvar credenciais:', result.error);
        throw result.error;
      }

      setCredentials(result.data);
      toast.success('Credenciais salvas com sucesso!');
      await loadCredentials();
    } catch (error: any) {
      console.error('Erro ao salvar credenciais:', error);
      toast.error('Erro ao salvar credenciais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteCredentials = async () => {
    if (!credentials?.id) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('evolution_credentials')
        .delete()
        .eq('id', credentials.id);

      if (error) {
        console.error('Erro ao deletar credenciais:', error);
        throw error;
      }

      setCredentials(null);
      setFormData({
        api_url: 'https://www.evolutionapi.workidigital.tech',
        api_key: '',
        instance_name: ''
      });
      toast.success('Credenciais removidas com sucesso');
    } catch (error: any) {
      console.error('Erro ao deletar credenciais:', error);
      toast.error('Erro ao deletar credenciais: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  return {
    credentials,
    loading,
    validating,
    formData,
    handleInputChange,
    validateCredentials,
    saveCredentials,
    deleteCredentials,
    loadCredentials
  };
};
