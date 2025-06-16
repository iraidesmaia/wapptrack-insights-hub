
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Shield, ShieldOff, Trash2, Edit, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { InvitedUserWithPermissions } from '@/types/permissions';
import { useInvites } from '@/hooks/useInvites';
import { inviteService } from '@/services/inviteService';
import { toast } from 'sonner';
import EditPermissionsDialog from './EditPermissionsDialog';

interface InvitedUsersListProps {
  users: InvitedUserWithPermissions[];
  isLoading: boolean;
}

const InvitedUsersList: React.FC<InvitedUsersListProps> = ({ users, isLoading }) => {
  const { revokeAccess, reactivateAccess, deleteInvite } = useInvites();
  const [editingUser, setEditingUser] = useState<InvitedUserWithPermissions | null>(null);
  const [copiedToken, setCopiedToken] = useState<string>('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'revoked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'revoked': return 'Revogado';
      default: return status;
    }
  };

  const getPermissionsSummary = (permissions: InvitedUserWithPermissions['permissions']) => {
    const viewPermissions = permissions.filter(p => p.can_view).length;
    const editPermissions = permissions.filter(p => p.can_edit).length;
    
    if (viewPermissions === 0) return 'Nenhuma permissão';
    
    return `${viewPermissions} seção${viewPermissions > 1 ? 'ões' : ''} (${editPermissions} com edição)`;
  };

  const copyInviteLink = async (token: string) => {
    try {
      const link = inviteService.generateInviteLink(token);
      await navigator.clipboard.writeText(link);
      setCopiedToken(token);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopiedToken(''), 2000);
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleRevokeAccess = async (userId: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja revogar o acesso de ${email}?`)) {
      try {
        await revokeAccess(userId);
      } catch (error) {
        console.error('Erro ao revogar acesso:', error);
      }
    }
  };

  const handleReactivateAccess = async (userId: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja reativar o acesso de ${email}?`)) {
      try {
        await reactivateAccess(userId);
      } catch (error) {
        console.error('Erro ao reativar acesso:', error);
      }
    }
  };

  const handleDeleteInvite = async (userId: string, email: string) => {
    if (window.confirm(`Tem certeza que deseja deletar permanentemente o convite de ${email}?`)) {
      try {
        await deleteInvite(userId);
      } catch (error) {
        console.error('Erro ao deletar convite:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhum usuário convidado ainda.</p>
        <p className="text-sm">Clique em "Convidar Usuário" para começar.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Permissões</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(user.status)}>
                    {getStatusLabel(user.status)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {getPermissionsSummary(user.permissions)}
                </TableCell>
                <TableCell className="text-sm">
                  {format(new Date(user.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </TableCell>
                <TableCell className="text-sm">
                  {user.last_login_at 
                    ? format(new Date(user.last_login_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                    : 'Nunca'
                  }
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Permissões
                      </DropdownMenuItem>
                      
                      {user.status === 'pending' && (
                        <DropdownMenuItem onClick={() => copyInviteLink(user.invite_token)}>
                          {copiedToken === user.invite_token ? (
                            <Check className="h-4 w-4 mr-2" />
                          ) : (
                            <Copy className="h-4 w-4 mr-2" />
                          )}
                          Copiar Link
                        </DropdownMenuItem>
                      )}
                      
                      {user.status === 'active' && (
                        <DropdownMenuItem 
                          onClick={() => handleRevokeAccess(user.id, user.email)}
                          className="text-orange-600"
                        >
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Revogar Acesso
                        </DropdownMenuItem>
                      )}
                      
                      {user.status === 'revoked' && (
                        <DropdownMenuItem 
                          onClick={() => handleReactivateAccess(user.id, user.email)}
                          className="text-green-600"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Reativar Acesso
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleDeleteInvite(user.id, user.email)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deletar Convite
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingUser && (
        <EditPermissionsDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => setEditingUser(null)}
        />
      )}
    </>
  );
};

export default InvitedUsersList;
