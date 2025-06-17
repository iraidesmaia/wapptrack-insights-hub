
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

  const requestQrCode = async () => {
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

      // Chamada simplificada para a Edge Function
      const { data, error } = await supabase.functions.invoke('request-qr-code', {
        body: { user_id: user.id }
      });

      console.log('=== RESPOSTA COMPLETA ===');
      console.log('Success data:', data);
      console.log('Error object:', error);

      if (error) {
        console.error('Erro da Edge Function:', error);
        
        // Tratamento específico para diferentes tipos de erro
        if (error.message?.includes('Invalid integration')) {
          toast.error('Erro de configuração da Evolution API. Verifique as credenciais.');
        } else if (error.message?.includes('non-2xx status code')) {
          toast.error('Erro de comunicação com o servidor WhatsApp. Tente novamente.');
        } else {
          toast.error('Erro ao gerar QR Code: ' + (error.message || 'Erro desconhecido'));
        }
        return;
      }

      // Verificar se a resposta é de sucesso
      if (data?.success) {
        console.log('QR Code gerado com sucesso');
        if (data.qrcode) {
          setQrCode(data.qrcode);
          toast.success('QR Code gerado! Escaneie com seu WhatsApp.');
        } else {
          toast.success('Instância criada. Aguardando QR Code...');
        }
        await loadInstance(); // Recarregar instância
      } else {
        console.error('Resposta de erro:', data);
        toast.error(data?.error || 'Falha ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('=== ERRO GERAL ===');
      console.error('Erro completo:', error);
      toast.error('Erro inesperado: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
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

  // Monitorar mudanças na instância em tempo real
  useEffect(() => {
    loadInstance();

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
    loadInstance
  };
};
