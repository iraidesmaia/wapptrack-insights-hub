
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/hooks/useTheme';
import { getClientSettings, saveClientSettings } from '@/services/clientSettingsService';
import { getClientEvolutionSettings, saveClientEvolutionSettings, testClientEvolutionConnection, type ClientEvolutionSettings } from '@/services/clientEvolutionService';
import type { CompanySettings, Theme } from '@/types';

export const useClientSettings = (clientId?: string) => {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [testingEvolution, setTestingEvolution] = useState(false);
  const { theme, setTheme } = useTheme();
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_subtitle: '',
    logo_url: '',
    theme: theme as Theme
  });
  
  const [evolutionConfig, setEvolutionConfig] = useState({
    evolution_api_key: '',
    evolution_instance_name: '',
    evolution_base_url: '',
    webhook_callback_url: 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook',
    webhook_url: ''
  });

  const loadSettings = async () => {
    if (!clientId) return;
    
    try {
      const data = await getClientSettings(clientId);
      
      if (data) {
        setSettings(data);
        setFormData({
          company_name: data.company_name || '',
          company_subtitle: data.company_subtitle || '',
          logo_url: data.logo_url || '',
          theme: (data.theme as Theme) || 'system'
        });
        
        if (data.theme) {
          setTheme(data.theme as Theme);
        }
      } else {
        setFormData({
          company_name: 'Sua Empresa',
          company_subtitle: 'Sistema de Marketing',
          logo_url: '',
          theme: 'system' as Theme
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadEvolutionConfig = async () => {
    if (!clientId) return;
    
    try {
      const data = await getClientEvolutionSettings(clientId);
      if (data) {
        setEvolutionConfig({
          evolution_api_key: data.evolution_api_key || '',
          evolution_instance_name: data.evolution_instance_name || '',
          evolution_base_url: data.evolution_base_url || '',
          webhook_callback_url: data.webhook_callback_url || 'https://gbrpboxxhlwmenrajdji.supabase.co/functions/v1/evolution-webhook',
          webhook_url: data.webhook_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading Evolution config:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEvolutionConfigChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEvolutionConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEvolutionConfig = async () => {
    if (!clientId) {
      toast.error('Nenhum cliente selecionado');
      return;
    }

    try {
      await saveClientEvolutionSettings({
        client_id: clientId,
        evolution_api_key: evolutionConfig.evolution_api_key,
        evolution_instance_name: evolutionConfig.evolution_instance_name,
        evolution_base_url: evolutionConfig.evolution_base_url,
        webhook_callback_url: evolutionConfig.webhook_callback_url,
        webhook_url: evolutionConfig.webhook_url
      });
      toast.success('Configurações da Evolution API salvas!');
    } catch (error) {
      console.error('Error saving Evolution config:', error);
      toast.error('Erro ao salvar configurações da Evolution API');
    }
  };

  const testEvolutionConnection = async () => {
    if (!clientId) {
      toast.error('Nenhum cliente selecionado');
      return;
    }

    if (!evolutionConfig.webhook_url) {
      toast.error('Por favor, configure a URL do webhook');
      return;
    }

    setTestingEvolution(true);
    
    try {
      const success = await testClientEvolutionConnection(clientId, evolutionConfig);
      
      if (success) {
        toast.success('Webhook testado com sucesso!');
      } else {
        toast.error('Erro ao testar webhook');
      }
    } catch (error: any) {
      console.error('Error testing webhook:', error);
      toast.error(`Erro ao testar webhook: ${error.message}`);
    } finally {
      setTestingEvolution(false);
    }
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setFormData(prev => ({
      ...prev,
      theme: newTheme
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Você deve selecionar uma imagem para upload.');
      }

      const file = event.target.files[0];
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('O arquivo deve ter no máximo 5MB.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Por favor, selecione apenas arquivos de imagem.');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: data.publicUrl
      }));

      toast.success('Logo enviada com sucesso!');
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(error.message || 'Erro ao enviar logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!clientId) {
      toast.error('Nenhum cliente selecionado');
      return;
    }

    try {
      setLoading(true);

      if (!formData.company_name.trim()) {
        toast.error('O nome da empresa é obrigatório');
        return;
      }

      await saveClientSettings(clientId, {
        company_name: formData.company_name.trim(),
        company_subtitle: formData.company_subtitle.trim(),
        logo_url: formData.logo_url,
        theme: formData.theme
      });

      toast.success('Configurações salvas com sucesso!');
      await loadSettings();
      
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadSettings();
      loadEvolutionConfig();
    }
  }, [clientId]);

  return {
    settings,
    loading,
    uploading,
    testingEvolution,
    formData,
    evolutionConfig,
    handleInputChange,
    handleEvolutionConfigChange,
    saveEvolutionConfig,
    testEvolutionConnection,
    handleThemeChange,
    handleFileUpload,
    handleSave
  };
};
