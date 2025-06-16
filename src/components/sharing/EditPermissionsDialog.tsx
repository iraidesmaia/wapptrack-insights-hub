
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InvitedUserWithPermissions, InviteFormData } from '@/types/permissions';
import { useInvites } from '@/hooks/useInvites';

interface EditPermissionsDialogProps {
  user: InvitedUserWithPermissions;
  onClose: () => void;
  onSuccess: () => void;
}

const EditPermissionsDialog: React.FC<EditPermissionsDialogProps> = ({
  user,
  onClose,
  onSuccess
}) => {
  const { updatePermissions, isUpdatingPermissions } = useInvites();

  // Inicializar permissões com base no usuário atual
  const [permissions, setPermissions] = useState<InviteFormData['permissions']>(() => {
    const initialPermissions: InviteFormData['permissions'] = {
      dashboard: { can_view: false, can_edit: false },
      leads: { can_view: false, can_edit: false },
      campaigns: { can_view: false, can_edit: false },
      sales: { can_view: false, can_edit: false },
      settings: { can_view: false, can_edit: false }
    };

    // Aplicar permissões existentes
    user.permissions.forEach(perm => {
      if (perm.section in initialPermissions) {
        initialPermissions[perm.section as keyof InviteFormData['permissions']] = {
          can_view: perm.can_view,
          can_edit: perm.can_edit
        };
      }
    });

    return initialPermissions;
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
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [type]: value,
        // Se está habilitando edição, automaticamente habilita visualização
        ...(type === 'can_edit' && value ? { can_view: true } : {})
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      await updatePermissions({ userId: user.id, permissions });
      onSuccess();
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Permissões - {user.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.key} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="font-medium">{section.label}</div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`${section.key}-view`}
                      checked={permissions[section.key].can_view}
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
                      checked={permissions[section.key].can_edit}
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

          <div className="flex space-x-2">
            <Button 
              onClick={handleSubmit} 
              disabled={isUpdatingPermissions}
              className="flex-1"
            >
              {isUpdatingPermissions ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPermissionsDialog;
