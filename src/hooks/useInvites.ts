
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inviteService } from '@/services/inviteService';
import { InviteFormData, InvitedUserWithPermissions } from '@/types/permissions';

export const useInvites = () => {
  const queryClient = useQueryClient();

  // Buscar usuários convidados
  const {
    data: invitedUsers = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['invited-users'],
    queryFn: inviteService.getInvitedUsers
  });

  // Criar convite
  const createInviteMutation = useMutation({
    mutationFn: inviteService.createInvite,
    onSuccess: (token) => {
      queryClient.invalidateQueries({ queryKey: ['invited-users'] });
      toast.success('Convite criado com sucesso!');
      return token;
    },
    onError: (error) => {
      toast.error('Erro ao criar convite: ' + error.message);
    }
  });

  // Atualizar permissões
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: InviteFormData['permissions'] }) =>
      inviteService.updatePermissions(userId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invited-users'] });
      toast.success('Permissões atualizadas com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar permissões: ' + error.message);
    }
  });

  // Revogar acesso
  const revokeAccessMutation = useMutation({
    mutationFn: inviteService.revokeAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invited-users'] });
      toast.success('Acesso revogado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao revogar acesso: ' + error.message);
    }
  });

  // Reativar acesso
  const reactivateAccessMutation = useMutation({
    mutationFn: inviteService.reactivateAccess,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invited-users'] });
      toast.success('Acesso reativado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao reativar acesso: ' + error.message);
    }
  });

  // Deletar convite
  const deleteInviteMutation = useMutation({
    mutationFn: inviteService.deleteInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invited-users'] });
      toast.success('Convite deletado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao deletar convite: ' + error.message);
    }
  });

  return {
    invitedUsers,
    isLoading,
    error,
    createInvite: createInviteMutation.mutateAsync,
    updatePermissions: updatePermissionsMutation.mutateAsync,
    revokeAccess: revokeAccessMutation.mutateAsync,
    reactivateAccess: reactivateAccessMutation.mutateAsync,
    deleteInvite: deleteInviteMutation.mutateAsync,
    isCreatingInvite: createInviteMutation.isPending,
    isUpdatingPermissions: updatePermissionsMutation.isPending
  };
};
