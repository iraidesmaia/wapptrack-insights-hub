
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

export const useEvolutionAutomation = () => {
  const [loading, setLoading] = useState(false);
  const [instance, setInstance] = useState<EvolutionAutoInstance | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const createAutomaticInstance = async (client_id?: string) => {
    setLoading(true);
    
    try {
      console.log('Creating automatic Evolution instance...');
      
      const { data, error } = await supabase.functions.invoke('create-evolution-instance', {
        body: { client_id }
      });

      if (error) {
        console.error('Function error:', error);
        throw new Error(error.message || 'Failed to create instance');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create instance');
      }

      console.log('Instance created successfully:', data);
      
      setInstance(data.instance);
      setQrCode(data.qr_code);
      
      toast.success('Instância Evolution criada com sucesso!');
      
      if (data.qr_code) {
        toast.success('QR Code gerado! Escaneie para conectar o WhatsApp.');
      }

      return data;

    } catch (error: any) {
      console.error('Error creating automatic instance:', error);
      toast.error(`Erro ao criar instância: ${error.message}`);
      throw error;
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

      if (error) throw error;

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
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error loading existing instance:', error);
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
    setQrCode
  };
};
