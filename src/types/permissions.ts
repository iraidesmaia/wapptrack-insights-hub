
export interface InvitedUser {
  id: string;
  email: string;
  invite_token: string;
  invited_by: string;
  status: 'pending' | 'active' | 'revoked';
  expires_at?: string;
  first_login_at?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  invited_user_id: string;
  section: 'dashboard' | 'leads' | 'campaigns' | 'sales' | 'settings';
  can_view: boolean;
  can_edit: boolean;
  created_at: string;
}

export interface InviteFormData {
  email: string;
  permissions: {
    [key in UserPermission['section']]: {
      can_view: boolean;
      can_edit: boolean;
    };
  };
  expires_in_days?: number;
}

export interface InvitedUserWithPermissions extends InvitedUser {
  permissions: UserPermission[];
}
