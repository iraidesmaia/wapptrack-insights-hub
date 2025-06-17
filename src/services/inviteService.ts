import { supabase } from '@/integrations/supabase/client';
import { InvitedUser, UserPermission, InviteFormData, InvitedUserWithPermissions } from '@/types/permissions';

export const inviteService = {
  // Buscar todos os usuários convidados com suas permissões
  async getInvitedUsers(): Promise<InvitedUserWithPermissions[]> {
    console.log('Buscando usuários convidados...');
    
    const { data: invitedUsers, error: usersError } = await supabase
      .from('invited_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Erro ao buscar usuários convidados:', usersError);
      throw usersError;
    }

    if (!invitedUsers || invitedUsers.length === 0) {
      console.log('Nenhum usuário convidado encontrado');
      return [];
    }

    const { data: permissions, error: permissionsError } = await supabase
      .from('user_permissions')
      .select('*')
      .in('invited_user_id', invitedUsers.map(user => user.id));

    if (permissionsError) {
      console.error('Erro ao buscar permissões:', permissionsError);
      throw permissionsError;
    }

    return invitedUsers.map(user => ({
      ...user,
      permissions: (permissions?.filter(p => p.invited_user_id === user.id) || []).map(p => ({
        id: p.id,
        invited_user_id: p.invited_user_id!,
        section: p.section as UserPermission['section'],
        can_view: p.can_view || false,
        can_edit: p.can_edit || false,
        created_at: p.created_at!
      }))
    } as InvitedUserWithPermissions));
  },

  // Criar um novo convite
  async createInvite(inviteData: InviteFormData): Promise<string> {
    console.log('Criando convite para:', inviteData.email);
    
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Usuário autenticado:', user?.id);
    
    if (authError) {
      console.error('Erro de autenticação:', authError);
      throw new Error('Erro de autenticação: ' + authError.message);
    }
    
    if (!user) {
      console.error('Usuário não autenticado');
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    const token = crypto.randomUUID();
    const expiresAt = inviteData.expires_in_days 
      ? new Date(Date.now() + inviteData.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    console.log('Inserindo usuário convidado com invited_by:', user.id);

    // Inserir usuário convidado com o invited_by
    const { data: invitedUser, error: userError } = await supabase
      .from('invited_users')
      .insert({
        email: inviteData.email,
        invite_token: token,
        invited_by: user.id,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (userError) {
      console.error('Erro ao inserir usuário convidado:', userError);
      throw new Error('Erro ao criar convite: ' + userError.message);
    }

    console.log('Usuário convidado criado:', invitedUser.id);

    // Inserir permissões
    const permissionsToInsert = Object.entries(inviteData.permissions)
      .filter(([_, perm]) => perm.can_view || perm.can_edit)
      .map(([section, perm]) => ({
        invited_user_id: invitedUser.id,
        section: section as UserPermission['section'],
        can_view: perm.can_view,
        can_edit: perm.can_edit
      }));

    if (permissionsToInsert.length > 0) {
      console.log('Inserindo permissões:', permissionsToInsert);
      
      const { error: permissionsError } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (permissionsError) {
        console.error('Erro ao inserir permissões:', permissionsError);
        throw new Error('Erro ao criar permissões: ' + permissionsError.message);
      }
    }

    console.log('Convite criado com sucesso, token:', token);
    return token;
  },

  // Atualizar permissões de um usuário
  async updatePermissions(userId: string, permissions: InviteFormData['permissions']): Promise<void> {
    // Deletar permissões existentes
    await supabase
      .from('user_permissions')
      .delete()
      .eq('invited_user_id', userId);

    // Inserir novas permissões
    const permissionsToInsert = Object.entries(permissions)
      .filter(([_, perm]) => perm.can_view || perm.can_edit)
      .map(([section, perm]) => ({
        invited_user_id: userId,
        section: section as UserPermission['section'],
        can_view: perm.can_view,
        can_edit: perm.can_edit
      }));

    if (permissionsToInsert.length > 0) {
      const { error } = await supabase
        .from('user_permissions')
        .insert(permissionsToInsert);

      if (error) throw error;
    }
  },

  // Revogar acesso
  async revokeAccess(userId: string): Promise<void> {
    const { error } = await supabase
      .from('invited_users')
      .update({ status: 'revoked' })
      .eq('id', userId);

    if (error) throw error;
  },

  // Reativar acesso
  async reactivateAccess(userId: string): Promise<void> {
    const { error } = await supabase
      .from('invited_users')
      .update({ status: 'active' })
      .eq('id', userId);

    if (error) throw error;
  },

  // Deletar convite
  async deleteInvite(userId: string): Promise<void> {
    const { error } = await supabase
      .from('invited_users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
  },

  // Gerar link de convite
  generateInviteLink(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/convite/${token}`;
  }
};
