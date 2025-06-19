
import { useState, useCallback } from 'react';
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
  const [lastConnectionStatus, setLastConnectionStatus] = useState<string | null>(null);

  const cleanInstanceName = (companyName: string): string => {
    return companyName
      .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .trim()
      .substring(0, 50); // Limit length
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
        return 'Minha_Empresa'; // Default fallback
      }

      return data?.company_name || 'Minha_Empresa';
    } catch (error) {
      console.error('Error getting company name:', error);
      return 'Minha_Empresa';
    }
  };

  const extractQrCode = (n8nData: N8nWebhookResponse): string | null => {
    console.log('Extracting QR code from n8n data:', n8nData);
    
    // Try different possible locations for the QR code
    if (n8nData.qrCode) {
      return n8nData.qrCode;
    }
    
    if (n8nData.data?.base64) {
      // Remove data:image/png;base64, prefix if present
      const base64Data = n8nData.data.base64.replace(/^data:image\/png;base64,/, '');
      return base64Data;
    }
    
    if (n8nData.data?.code) {
      return n8nData.data.code;
    }
    
    return null;
  };

  const resetInstanceState = useCallback(() => {
    console.log('Resetando estado da instância para configuração inicial');
    setInstance(null);
    setQrCode(null);
    setLastConnectionStatus(null);
  }, []);

  const deleteInstanceFromDatabase = useCallback(async (instanceId: string) => {
    try {
      console.log('Deletando instância do banco:', instanceId);
      const { error } = await supabase
        .from('evolution_auto_instances')
        .delete()
        .eq('id', instanceId);

      if (error) {
        console.error('Erro ao deletar instância:', error);
        return false;
      }

      console.log('Instância deletada com sucesso do banco');
      return true;
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      return false;
    }
  }, []);

  const handleDisconnection = useCallback(async (currentInstance: EvolutionAutoInstance) => {
    console.log('Instância desconectada, resetando para configuração inicial');
    
    // Deletar a instância do banco de dados
    const deleted = await deleteInstanceFromDatabase(currentInstance.id);
    
    if (deleted) {
      // Resetar todo o estado local
      resetInstanceState();
      toast.info('Instância desconectada. Configure uma nova instância.');
    }
  }, [deleteInstanceFromDatabase, resetInstanceState]);

  const createAutomaticInstance = async (client_id?: string) => {
    setLoading(true);
    
    try {
      console.log('Creating Evolution instance via n8n...');
      
      // Get company name from settings
      const companyName = await getCompanyName();
      const instanceName = cleanInstanceName(companyName);
      
      console.log('Using company name as instance name:', { companyName, instanceName });

      // Call n8n webhook with new URL
      const n8nResponse = await fetch('https://n8n.workidigital.tech/webhook/gerar-instancia-evolution', {
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

      // Extract QR code from response
      const extractedQrCode = extractQrCode(n8nData);
      console.log('Extracted QR code:', extractedQrCode ? 'Found' : 'Not found');

      // Save instance data to database
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
      setLastConnectionStatus(savedInstance.connection_status);
      
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
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const generateNewQrCode = useCallback(async () => {
    if (!instance) return;

    setLoading(true);
    try {
      console.log('Gerando novo QR code para instância:', instance.instance_name);

      const n8nResponse = await fetch('https://n8n.workidigital.tech/webhook/gerar-instancia-evolution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName: instance.instance_name
        })
      });

      if (!n8nResponse.ok) {
        throw new Error(`Falha ao gerar novo QR: ${n8nResponse.status}`);
      }

      const n8nData: N8nWebhookResponse = await n8nResponse.json();
      
      if (!n8nData.success) {
        throw new Error(n8nData.error || 'Falha ao gerar novo QR code');
      }

      const newQrCode = extractQrCode(n8nData);
      
      if (newQrCode) {
        // Atualizar no banco
        const { error } = await supabase
          .from('evolution_auto_instances')
          .update({ 
            qr_code_base64: newQrCode,
            connection_status: 'waiting_scan',
            updated_at: new Date().toISOString()
          })
          .eq('id', instance.id);

        if (!error) {
          setQrCode(newQrCode);
          setInstance(prev => prev ? { ...prev, qr_code_base64: newQrCode, connection_status: 'waiting_scan' } : null);
          setLastConnectionStatus('waiting_scan');
          toast.success('Novo QR Code gerado com sucesso!');
        }
      } else {
        throw new Error('QR Code não foi gerado na resposta');
      }
    } catch (error: any) {
      console.error('Erro ao gerar novo QR:', error);
      toast.error(`Erro ao gerar novo QR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [instance]);

  const checkInstanceStatus = async (instanceId: string) => {
    try {
      const { data, error } = await supabase
        .from('evolution_auto_instances')
        .select('*')
        .eq('id', instanceId)
        .single();

      if (error) {
        console.log('Instância não encontrada no banco, resetando estado');
        resetInstanceState();
        return null;
      }

      // Verificar se houve mudança no status de conexão
      if (data && lastConnectionStatus && lastConnectionStatus !== data.connection_status) {
        console.log('Status mudou de', lastConnectionStatus, 'para', data.connection_status);
        
        // Se estava conectado e agora desconectou
        if (lastConnectionStatus === 'open' && data.connection_status !== 'open') {
          await handleDisconnection(data);
          return null; // Retorna null para indicar que foi resetado
        }
        
        // Se era waiting_scan e agora conectou
        if (lastConnectionStatus === 'waiting_scan' && data.connection_status === 'open') {
          toast.success('WhatsApp conectado com sucesso!');
        }
      }

      setInstance(data);
      setLastConnectionStatus(data.connection_status);
      
      // Se o status for waiting_scan e não temos QR code, tentar buscar
      if (data.connection_status === 'waiting_scan' && !data.qr_code_base64) {
        console.log('Status waiting_scan mas sem QR code, gerando novo...');
        setTimeout(() => generateNewQrCode(), 1000);
      }
      
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

      const { data, error } = await query.limit(1).maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading instance:', error);
        return null;
      }

      if (data) {
        console.log('Instância carregada:', data);
        
        // Verificar se a instância realmente existe fazendo uma segunda consulta
        const { data: verifyData, error: verifyError } = await supabase
          .from('evolution_auto_instances')
          .select('*')
          .eq('id', data.id)
          .single();

        if (verifyError || !verifyData) {
          console.log('Instância não existe mais, resetando estado');
          resetInstanceState();
          return null;
        }

        setInstance(verifyData);
        setQrCode(verifyData.qr_code_base64);
        setLastConnectionStatus(verifyData.connection_status);
        
        // Se a instância existe mas não está conectada, verificar se precisa gerar novo QR
        if (verifyData.connection_status === 'waiting_scan' && !verifyData.qr_code_base64) {
          console.log('Instância aguardando scan mas sem QR, gerando novo...');
          setTimeout(() => generateNewQrCode(), 1000);
        }
        
        return verifyData;
      }

      // Se não encontrou dados, garantir que o estado está limpo
      resetInstanceState();
      return null;
    } catch (error) {
      console.error('Error loading existing instance:', error);
      resetInstanceState();
      return null;
    }
  };

  return {
    loading,
    instance,
    qrCode,
    createAutomaticInstance,
    checkInstanceStatus,
    loadExistingInstance,
    generateNewQrCode,
    resetInstanceState,
    setQrCode
  };
};
