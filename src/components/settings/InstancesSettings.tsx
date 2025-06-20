
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

  if (loading) return <div>Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Gerenciar Instâncias Evolution API</span>
        </CardTitle>
        <CardDescription>
          Configure suas instâncias do WhatsApp para atribuição automática de leads orgânicos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Adicionar Nova Instância */}
        <div className="border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Adicionar Nova Instância</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância *</Label>
              <Input
                id="instance_name"
                value={newInstance.instance_name}
                onChange={(e) => setNewInstance(prev => ({ ...prev, instance_name: e.target.value }))}
                placeholder="Ex: MinhaInstancia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Número do WhatsApp</Label>
              <Input
                id="phone_number"
                value={newInstance.phone_number}
                onChange={(e) => setNewInstance(prev => ({ ...prev, phone_number: e.target.value }))}
                placeholder="Ex: 5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="base_url">URL Base da API</Label>
              <Input
                id="base_url"
                value={newInstance.base_url}
                onChange={(e) => setNewInstance(prev => ({ ...prev, base_url: e.target.value }))}
                placeholder="Ex: https://api.evolution.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="api_key">API Key</Label>
              <Input
                id="api_key"
                type="password"
                value={newInstance.api_key}
                onChange={(e) => setNewInstance(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Sua API Key"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={newInstance.is_default_for_organic}
              onCheckedChange={(checked) => setNewInstance(prev => ({ ...prev, is_default_for_organic: checked }))}
            />
            <Label>Usar como padrão para leads orgânicos</Label>
          </div>
          <Button onClick={handleAddInstance} disabled={saving}>
            <Plus className="w-4 h-4 mr-2" />
            {saving ? 'Adicionando...' : 'Adicionar Instância'}
          </Button>
        </div>

        {/* Lista de Instâncias */}
        <div className="space-y-4">
          <h4 className="font-medium">Instâncias Configuradas</h4>
          {instances.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma instância configurada ainda
            </p>
          ) : (
            instances.map((instance) => (
              <div key={instance.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h5 className="font-medium">{instance.instance_name}</h5>
                      {instance.is_default_for_organic && (
                        <Badge variant="default">Padrão para Orgânicos</Badge>
                      )}
                      {!instance.active && (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>
                    {instance.phone_number && (
                      <p className="text-sm text-muted-foreground">
                        WhatsApp: {instance.phone_number}
                      </p>
                    )}
                    {instance.base_url && (
                      <p className="text-sm text-muted-foreground">
                        API: {instance.base_url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={instance.is_default_for_organic}
                        onCheckedChange={(checked) => handleToggleDefault(instance.id, checked)}
                      />
                      <Label className="text-sm">Padrão</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={instance.active}
                        onCheckedChange={(checked) => handleToggleActive(instance.id, checked)}
                      />
                      <Label className="text-sm">Ativa</Label>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteInstance(instance.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Como funciona a atribuição:</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>Quando alguém manda mensagem direta pelo WhatsApp, o sistema identifica qual instância recebeu</li>
            <li>O lead orgânico é automaticamente atribuído ao usuário dono da instância</li>
            <li>Mensagens de grupo (terminam com @g.us) são automaticamente ignoradas</li>
            <li>Se não houver configuração específica, usa a instância marcada como "Padrão"</li>
            <li>Isso evita leads sem dono e melhora a organização</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default InstancesSettings;
