
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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('Solicitando QR Code para usuário:', user.id);

      // Usar invoke corretamente com headers de autorização
      const { data, error } = await supabase.functions.invoke('request-qr-code', {
        body: { user_id: user.id },
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Resposta da Edge Function:', { data, error });

      if (error) {
        console.error('Erro ao solicitar QR Code:', error);
        toast.error('Erro ao gerar QR Code: ' + error.message);
        return;
      }

      if (data?.success) {
        setQrCode(data.qrcode);
        toast.success('QR Code gerado com sucesso!');
        await loadInstance(); // Recarregar para pegar a nova instância
      } else {
        console.error('Erro na resposta:', data);
        toast.error(data?.error || 'Erro ao gerar QR Code');
      }
    } catch (error: any) {
      console.error('Erro ao solicitar QR Code:', error);
      toast.error('Erro ao conectar com o servidor: ' + error.message);
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
