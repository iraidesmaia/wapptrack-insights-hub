
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Copy, Check } from 'lucide-react';
import { useInvites } from '@/hooks/useInvites';
import { InviteFormData } from '@/types/permissions';
import { inviteService } from '@/services/inviteService';
import { toast } from 'sonner';

interface InviteFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const InviteForm: React.FC<InviteFormProps> = ({ onClose, onSuccess }) => {
  const { createInvite, isCreatingInvite } = useInvites();
  const [inviteLink, setInviteLink] = useState<string>('');
  const [copied, setCopied] = useState(false);
  
  const [formData, setFormData] = useState<InviteFormData>({
    email: '',
    permissions: {
      dashboard: { can_view: false, can_edit: false },
      leads: { can_view: false, can_edit: false },
      campaigns: { can_view: false, can_edit: false },
      sales: { can_view: false, can_edit: false },
      settings: { can_view: false, can_edit: false }
    },
    expires_in_days: 30
  });

  const sections = [
    { key: 'dashboard' as const, label: 'Dashboard' },
    { key: 'leads' as const, label: 'Leads' },
    { key: 'campaigns' as const, label: 'Campanhas' },
    { key: 'sales' as const, label: 'Vendas' },
    { key: 'settings' as const, label: 'Configurações' }
  ];

  const handlePermissionChange = (
    section: keyof InviteFormData['permissions'],
    type: 'can_view' | 'can_edit',
    value: boolean
  ) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [section]: {
          ...prev.permissions[section],
          [type]: value,
          // Se está habilitando edição, automaticamente habilita visualização
          ...(type === 'can_edit' && value ? { can_view: true } : {})
        }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast.error('Email é obrigatório');
      return;
    }

    // Verificar se pelo menos uma permissão foi selecionada
    const hasPermissions = Object.values(formData.permissions).some(
      perm => perm.can_view || perm.can_edit
    );

    if (!hasPermissions) {
      toast.error('Selecione pelo menos uma permissão');
      return;
    }

    try {
      const token = await createInvite(formData);
      const link = inviteService.generateInviteLink(token);
      setInviteLink(link);
    } catch (error) {
      console.error('Erro ao criar convite:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  if (inviteLink) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">Convite Criado com Sucesso!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Link do Convite</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input 
                value={inviteLink} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={copyToClipboard}
                title="Copiar link"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={onSuccess} className="flex-1">
              Concluir
            </Button>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Convidar Usuário</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email do Usuário</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="usuario@exemplo.com"
              required
            />
          </div>

          <div className="space-y-4">
            <Label>Permissões de Acesso</Label>
            <div className="space-y-3">
              {sections.map(section => (
                <div key={section.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="font-medium">{section.label}</div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${section.key}-view`}
                        checked={formData.permissions[section.key].can_view}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(section.key, 'can_view', checked as boolean)
                        }
                      />
                      <Label htmlFor={`${section.key}-view`} className="text-sm">
                        Visualizar
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${section.key}-edit`}
                        checked={formData.permissions[section.key].can_edit}
                        onCheckedChange={(checked) => 
                          handlePermissionChange(section.key, 'can_edit', checked as boolean)
                        }
                      />
                      <Label htmlFor={`${section.key}-edit`} className="text-sm">
                        Editar
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expires">Expiração do Convite</Label>
            <Select
              value={formData.expires_in_days?.toString() || '30'}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                expires_in_days: value === 'never' ? undefined : parseInt(value)
              }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="60">60 dias</SelectItem>
                <SelectItem value="never">Nunca expira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={isCreatingInvite} className="flex-1">
              {isCreatingInvite ? 'Criando...' : 'Criar Convite'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InviteForm;
