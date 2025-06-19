
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings, Smartphone } from 'lucide-react';
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
  const { user } = useAuth();

  const loadInstances = async () => {
    try {
      const { data, error } = await supabase
        .from('evolution_instances')
        .select('*')
        .order('created_at', { ascending: false });

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
      const { error } = await supabase
        .from('evolution_instances')
        .insert({
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
        await supabase
          .from('evolution_instances')
          .update({ is_default_for_organic: false })
          .neq('id', instanceId);
      }

      const { error } = await supabase
        .from('evolution_instances')
        .update({ is_default_for_organic: isDefault })
        .eq('id', instanceId);

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
      const { error } = await supabase
        .from('evolution_instances')
        .update({ active })
        .eq('id', instanceId);

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
      const { error } = await supabase
        .from('evolution_instances')
        .delete()
        .eq('id', instanceId);

      if (error) throw error;

      toast.success('Instância deletada com sucesso');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao deletar instância:', error);
      toast.error('Erro ao deletar instância');
    }
  };

  if (loading) return <div className="text-center py-4">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Smartphone className="w-5 h-5" />
          <span>Instâncias Evolution API</span>
        </CardTitle>
        <CardDescription>
          Gerencie suas instâncias de WhatsApp conectadas à Evolution API
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar nova instância */}
        <div className="border rounded-lg p-4 space-y-4">
          <h3 className="font-medium">Adicionar Nova Instância</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância *</Label>
              <Input
                id="instance_name"
                value={newInstance.instance_name}
                onChange={(e) => setNewInstance(prev => ({ ...prev, instance_name: e.target.value }))}
                placeholder="Minha Instância"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Número do WhatsApp</Label>
              <Input
                id="phone_number"
                value={newInstance.phone_number}
                onChange={(e) => setNewInstance(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="+55 11 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">URL Base da API</Label>
              <Input
                id="base_url"
                value={newInstance.base_url}
                onChange={(e) => setNewInstance(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder="https://api.evolution.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={newInstance.api_key}
                onChange={(e) => setNewInstance(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="sua-api-key"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_default"
              checked={newInstance.is_default_for_organic}
              onCheckedChange={(checked) => setNewInstance(prev => ({ ...prev, is_default_for_organic: checked }))}
            />
            <Label htmlFor="is_default">Usar como padrão para leads orgânicos</Label>
          </div>

          <Button onClick={handleAddInstance} disabled={saving}>
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Adicionando...' : 'Adicionar Instância'}
          </Button>
        </div>

        {/* Lista de instâncias */}
        <div className="space-y-4">
          <h3 className="font-medium">Instâncias Configuradas</h3>
          
          {instances.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma instância configurada ainda
            </p>
          ) : (
            instances.map((instance) => (
              <div key={instance.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium">{instance.instance_name}</h4>
                    <div className="flex space-x-2">
                      {instance.is_default_for_organic && (
                        <Badge variant="secondary">Padrão</Badge>
                      )}
                      <Badge variant={instance.active ? "default" : "destructive"}>
                        {instance.active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteInstance(instance.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {instance.phone_number && (
                  <p className="text-sm text-muted-foreground">
                    📱 {instance.phone_number}
                  </p>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={instance.active}
                      onCheckedChange={(checked) => handleToggleActive(instance.id, checked)}
                    />
                    <Label>Ativa</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={instance.is_default_for_organic}
                      onCheckedChange={(checked) => handleToggleDefault(instance.id, checked)}
                    />
                    <Label>Padrão para orgânico</Label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default InstancesSettings;
