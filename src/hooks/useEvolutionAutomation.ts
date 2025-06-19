
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EvolutionAutoInstance {
  id: string;
  user_id: string;
  client_id?: string;
  instance_name: string;
  instance_token?: string;
  qr_code_base64?: string;
  connection_status: string;
  webhook_configured: boolean;
  created_at: string;
  updated_at: string;
}

interface N8nWebhookResponse {
  success: boolean;
  instanceName?: string;
  qrCode?: string;
  status?: string;
  error?: string;
  data?: {
    pairingCode?: string;
    code?: string;
    base64?: string;
    count?: number;
  };
}

export const useEvolutionAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [instance, setInstance] = useState<EvolutionAutoInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrCodeCreatedAt, setQrCodeCreatedAt] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [pollingInterval, setPollingInterval] = useState(5000);

  const QR_CODE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  // Função para limpar completamente o estado
  const clearAllState = () => {
    setInstance(null);
    setQrCode(null);
    setQrCodeCreatedAt(null);
    setRetryCount(0);
    setPollingInterval(5000);
  };

  const cleanInstanceName = (companyName: string): string => {
    return companyName
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .trim()
      .substring(0, 50);
  };

  const getCompanyName = async (): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('company_settings')
        .select('company_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching company name:', error);
        return 'Minha_Empresa';
      }

      return data?.company_name || 'Minha_Empresa';
    } catch (error) {
      console.error('Error getting company name:', error);
      return 'Minha_Empresa';
    }
  };

  const extractQrCode = (n8nData: N8nWebhookResponse): string | null => {
    console.log('Extracting QR code from n8n data:', n8nData);
    
    if (n8nData.qrCode) {
      return n8nData.qrCode;
    }
    
    if (n8nData.data?.base64) {
      const base64Data = n8nData.data.base64.replace(/^data:image\/png;base64,/, '');
      return base64Data;
    }
    
    if (n8nData.data?.code) {
      return n8nData.data.code;
    }
    
    return null;
  };

  const isQrCodeExpired = (): boolean => {
    if (!qrCodeCreatedAt) return false;
    return Date.now() - qrCodeCreatedAt.getTime() > QR_CODE_TIMEOUT;
  };

  const getTimeRemaining = (): number => {
    if (!qrCodeCreatedAt) return 0;
    const remaining = QR_CODE_TIMEOUT - (Date.now() - qrCodeCreatedAt.getTime());
    return Math.max(0, remaining);
  };

  const createAutomaticInstance = async (client_id?: string) => {
    setLoading(true);
    
    try {
      console.log('Creating Evolution instance via n8n...');
      
      const companyName = await getCompanyName();
      const instanceName = cleanInstanceName(companyName);
      
      console.log('Using company name as instance name:', { companyName, instanceName });

      const n8nResponse = await fetch('https://n8n.workidigital.tech/webhook-test/gerar-instancia-evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instanceName
        })
      });

      if (!n8nResponse.ok) {
        throw new Error(`n8n webhook failed: ${n8nResponse.status} ${n8nResponse.statusText}`);
      }

      const n8nData: N8nWebhookResponse = await n8nResponse.json();
      console.log('n8n response:', n8nData);

      if (!n8nData.success) {
        throw new Error(n8nData.error || 'Failed to create instance via n8n');
      }

      const extractedQrCode = extractQrCode(n8nData);
      console.log('Extracted QR code:', extractedQrCode ? 'Found' : 'Not found');

      const instanceData = {
        user_id: (await supabase.auth.getUser()).data.user?.id,
        client_id: client_id || null,
        instance_name: n8nData.instanceName || instanceName,
        instance_token: 'managed_by_n8n',
        qr_code_base64: extractedQrCode,
        connection_status: n8nData.status || 'waiting_scan',
        webhook_configured: true,
        updated_at: new Date().toISOString()
      };

      console.log('Saving instance data to database:', instanceData);

      const { data: savedInstance, error: saveError } = await supabase
        .from('evolution_auto_instances')
        .upsert(instanceData, {
          onConflict: 'user_id,instance_name'
        })
        .select()
        .single();

      if (saveError) {
        console.error('Database save error:', saveError);
        throw new Error(`Failed to save instance data: ${saveError.message}`);
      }

      setInstance(savedInstance);
      setQrCode(extractedQrCode);
      setQrCodeCreatedAt(new Date());
      setRetryCount(0);
      setPollingInterval(5000);
      
      toast.success('Instância Evolution criada com sucesso via n8n!');
      
      if (extractedQrCode) {
        toast.success('QR Code gerado! Escaneie para conectar o WhatsApp.');
      } else {
        toast.info('Instância criada, mas QR Code não foi gerado. Verifique os logs.');
      }

      return {
        success: true,
        instance: savedInstance,
        qr_code: extractedQrCode
      };

    } catch (error: any) {
      console.error('Error creating instance via n8n:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      clearAllState(); // Limpar estado em caso de erro
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const regenerateQrCode = async () => {
    if (!instance) return;
    
    setLoading(true);
    try {
      console.log('Regenerating QR Code for instance:', instance.instance_name);
      
      const n8nResponse = await fetch('https://n8n.workidigital.tech/webhook-test/gerar-instancia-evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instance.instance_name
        })
      });

      if (!n8nResponse.ok) {
        throw new Error(`Failed to regenerate QR code: ${n8nResponse.status}`);
      }

      const n8nData: N8nWebhookResponse = await n8nResponse.json();
      
      if (!n8nData.success) {
        throw new Error(n8nData.error || 'Failed to regenerate QR code');
      }

      const extractedQrCode = extractQrCode(n8nData);
      
      if (extractedQrCode) {
        const { error } = await supabase
          .from('evolution_auto_instances')
          .update({
            qr_code_base64: extractedQrCode,
            connection_status: 'waiting_scan',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        if (error) {
          throw new Error('Failed to update QR code in database');
        }

        setQrCode(extractedQrCode);
        setQrCodeCreatedAt(new Date());
        setRetryCount(prev => prev + 1);
        setPollingInterval(5000);
        
        toast.success('Novo QR Code gerado com sucesso!');
      } else {
        throw new Error('QR Code não foi gerado na resposta');
      }
      
    } catch (error: any) {
      console.error('Error regenerating QR code:', error);
      toast.error(`Erro ao gerar novo QR Code: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async () => {
    if (!instance) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('evolution_auto_instances')
        .delete()
        .eq('id', instance.id);

      if (error) {
        throw new Error('Failed to delete instance from database');
      }

      // Limpar completamente o estado após deletar
      clearAllState();
      
      toast.success('Instância deletada com sucesso!');
      
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error(`Erro ao deletar instância: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkInstanceStatus = async (instanceId: string) => {
    try {
      const { data, error } = await supabase
        .from('evolution_auto_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (error) {
        // Se instância não existe mais, limpar estado
        if (error.code === 'PGRST116') {
          clearAllState();
          return null;
        }
        throw error;
      }

      setInstance(data);
      return data;
    } catch (error) {
      console.error('Error checking instance status:', error);
      return null;
    }
  };

  const loadExistingInstance = async (client_id?: string) => {
    try {
      let query = supabase
        .from('evolution_auto_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (client_id) {
        query = query.eq('client_id', client_id);
      } else {
        query = query.is('client_id', null);
      }

      const { data, error } = await query.limit(1).single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading instance:', error);
        return null;
      }

      if (data) {
        setInstance(data);
        setQrCode(data.qr_code_base64);
        if (data.qr_code_base64) {
          setQrCodeCreatedAt(new Date(data.updated_at));
        }
        return data;
      }

      // Se não há dados, garantir que estado está limpo
      clearAllState();
      return null;
    } catch (error) {
      console.error('Error loading existing instance:', error);
      clearAllState();
      return null;
    }
  };

  return {
    loading,
    instance,
    qrCode,
    qrCodeCreatedAt,
    retryCount,
    pollingInterval,
    isQrCodeExpired,
    getTimeRemaining,
    createAutomaticInstance,
    regenerateQrCode,
    deleteInstance,
    checkInstanceStatus,
    loadExistingInstance,
    setQrCode,
    setPollingInterval
  };
};
