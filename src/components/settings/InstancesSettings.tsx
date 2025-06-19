import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
interface EvolutionInstance {
  id: string;
  instance_name: string;
  instance_id?: string;
  api_key?: string;
  base_url?: string;
  phone_number?: string;
  is_default_for_organic: boolean;
  active: boolean;
  created_at: string;
}
const InstancesSettings = () => {
  const [instances, setInstances] = useState<EvolutionInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newInstance, setNewInstance] = useState({
    instance_name: '',
    instance_id: '',
    api_key: '',
    base_url: '',
    phone_number: '',
    is_default_for_organic: false
  });
  const {
    user
  } = useAuth();
  const loadInstances = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('evolution_instances').select('*').order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setInstances(data || []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
      toast.error('Erro ao carregar instâncias');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user) {
      loadInstances();
    }
  }, [user]);
  const handleAddInstance = async () => {
    if (!newInstance.instance_name.trim()) {
      toast.error('Nome da instância é obrigatório');
      return;
    }
    setSaving(true);
    try {
      const {
        error
      } = await supabase.from('evolution_instances').insert({
        ...newInstance,
        user_id: user?.id
      });
      if (error) throw error;
      toast.success('Instância adicionada com sucesso');
      setNewInstance({
        instance_name: '',
        instance_id: '',
        api_key: '',
        base_url: '',
        phone_number: '',
        is_default_for_organic: false
      });
      await loadInstances();
    } catch (error) {
      console.error('Erro ao adicionar instância:', error);
      toast.error('Erro ao adicionar instância');
    } finally {
      setSaving(false);
    }
  };
  const handleToggleDefault = async (instanceId: string, isDefault: boolean) => {
    try {
      // Se marcando como padrão, primeiro desmarcar todas as outras
      if (isDefault) {
        await supabase.from('evolution_instances').update({
          is_default_for_organic: false
        }).neq('id', instanceId);
      }
      const {
        error
      } = await supabase.from('evolution_instances').update({
        is_default_for_organic: isDefault
      }).eq('id', instanceId);
      if (error) throw error;
      toast.success(isDefault ? 'Instância marcada como padrão' : 'Padrão removido');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao atualizar instância:', error);
      toast.error('Erro ao atualizar instância');
    }
  };
  const handleToggleActive = async (instanceId: string, active: boolean) => {
    try {
      const {
        error
      } = await supabase.from('evolution_instances').update({
        active
      }).eq('id', instanceId);
      if (error) throw error;
      toast.success(active ? 'Instância ativada' : 'Instância desativada');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao atualizar instância:', error);
      toast.error('Erro ao atualizar instância');
    }
  };
  const handleDeleteInstance = async (instanceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta instância?')) return;
    try {
      const {
        error
      } = await supabase.from('evolution_instances').delete().eq('id', instanceId);
      if (error) throw error;
      toast.success('Instância deletada com sucesso');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância');
    }
  };
  if (loading) return <div>Carregando...</div>;
  return <Card>
      
      
    </Card>;
};
export default InstancesSettings;