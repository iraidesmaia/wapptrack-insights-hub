
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionCredentials {
  id: string;
  user_id: string;
  api_url: string;
  api_key: string;
  instance_name: string | null;
  status: string;
  validated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CredentialsFormData {
  api_url: string;
  api_key: string;
  instance_name: string;
}

export const useEvolutionCredentials = () => {
  const [credentials, setCredentials] = useState<EvolutionCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const [formData, setFormData] = useState<CredentialsFormData>({
    api_url: '',
    api_key: '',
    instance_name: ''
  });

  const loadCredentials = async () => {
    try {
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
          api_url: data.api_url,
          api_key: data.api_key,
          instance_name: data.instance_name || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
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
      toast.error('URL da API e chave são obrigatórias');
      return;
    }

    setValidating(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { data, error } = await supabase.functions.invoke('validate-evolution-credentials', {
        body: {
          api_url: formData.api_url,
          api_key: formData.api_key,
          instance_name: formData.instance_name
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Erro na validação:', error);
        toast.error('Erro ao validar credenciais: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data?.success) {
        toast.success('Credenciais validadas e salvas com sucesso!');
        await loadCredentials(); // Recarregar credenciais
      } else {
        toast.error(data?.error || 'Falha na validação das credenciais');
      }
    } catch (error: any) {
      console.error('Erro inesperado:', error);
      toast.error('Erro inesperado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setValidating(false);
    }
  };

  const deleteCredentials = async () => {
    if (!credentials) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('evolution_credentials')
        .delete()
        .eq('id', credentials.id);

      if (error) {
        console.error('Erro ao deletar credenciais:', error);
        toast.error('Erro ao deletar credenciais');
        return;
      }

      setCredentials(null);
      setFormData({
        api_url: '',
        api_key: '',
        instance_name: ''
      });
      toast.success('Credenciais deletadas com sucesso');
    } catch (error) {
      console.error('Erro ao deletar credenciais:', error);
      toast.error('Erro ao deletar credenciais');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCredentials();
  }, []);

  return {
    credentials,
    formData,
    loading,
    validating,
    handleInputChange,
    validateCredentials,
    deleteCredentials,
    loadCredentials
  };
};
