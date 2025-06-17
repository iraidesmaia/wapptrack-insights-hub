import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WhatsAppInstance {
  id: string;
  instance_name: string;
  status: string;
  qrcode_base64?: string;
  phone_number?: string;
  user_name_wpp?: string;
  created_at: string;
  updated_at: string;
}

export const useWhatsAppInstance = () => {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [evolutionCredentials, setEvolutionCredentials] = useState<any>(null);

  const loadInstance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar instância:', error);
        return;
      }

      if (data) {
        setInstance(data);
        setQrCode(data.qrcode_base64);
      }
    } catch (error) {
      console.error('Erro ao carregar instância:', error);
    }
  };

  const requestQrCode = async (customCredentials?: any) => {
    try {
      setLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Erro ao obter usuário:', userError);
        toast.error('Erro de autenticação: ' + userError.message);
        return;
      }

      if (!user) {
        console.error('Usuário não autenticado');
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('=== SOLICITANDO QR CODE ===');
      console.log('User ID:', user.id);

      // Usar credenciais customizadas se fornecidas, senão usar as padrão
      const requestPayload: any = { user_id: user.id };
      
      if (customCredentials || evolutionCredentials) {
        requestPayload.evolution_credentials = customCredentials || evolutionCredentials;
        console.log('Usando credenciais customizadas');
      } else {
        console.log('Usando credenciais padrão');
      }

      const { data, error } = await supabase.functions.invoke('request-qr-code', {
        body: requestPayload
      });

      console.log('=== RESPOSTA COMPLETA ===');
      console.log('Success data:', data);
      console.log('Error object:', error);

      if (error) {
        console.error('Erro da Edge Function:', error);
        toast.error('Erro ao gerar QR Code: ' + (error.message || 'Erro desconhecido'));
        return;
      }

      if (data?.success) {
        console.log('QR Code gerado com sucesso');
        if (data.qrcode) {
          setQrCode(data.qrcode);
          toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
        } else {
          toast.success('Instância criada. Aguardando QR Code...');
        }
        await loadInstance();
      } else {
        console.error('Resposta de erro:', data);
        toast.error(data?.error || 'Falha ao gerar QR Code');
        
        // Mostrar sugestão se disponível
        if (data?.suggestion) {
          toast.info(data.suggestion);
        }
      }
    } catch (error: any) {
      console.error('=== ERRO GERAL ===');
      console.error('Erro completo:', error);
      toast.error('Erro inesperado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (credentials: any) => {
    setEvolutionCredentials(credentials);
    localStorage.setItem('evolution_credentials', JSON.stringify(credentials));
  };

  const loadStoredCredentials = () => {
    try {
      const stored = localStorage.getItem('evolution_credentials');
      if (stored) {
        const credentials = JSON.parse(stored);
        setEvolutionCredentials(credentials);
        return credentials;
      }
    } catch (error) {
      console.error('Erro ao carregar credenciais:', error);
    }
    return null;
  };

  const deleteInstance = async () => {
    if (!instance) return;

    try {
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', instance.id);

      if (error) {
        console.error('Erro ao deletar instância:', error);
        toast.error('Erro ao deletar instância');
        return;
      }

      setInstance(null);
      setQrCode(null);
      toast.success('Instância deletada com sucesso');
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância');
    }
  };

  useEffect(() => {
    loadInstance();
    loadStoredCredentials();

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('whatsapp_instances_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'whatsapp_instances',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Mudança na instância:', payload);
            
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newData = payload.new as WhatsAppInstance;
              setInstance(newData);
              setQrCode(newData.qrcode_base64);
            } else if (payload.eventType === 'DELETE') {
              setInstance(null);
              setQrCode(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeSubscription();
  }, []);

  return {
    instance,
    qrCode,
    loading,
    requestQrCode,
    deleteInstance,
    loadInstance,
    setCredentials,
    evolutionCredentials
  };
};
