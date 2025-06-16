
-- Criar tabela para usuários convidados
CREATE TABLE invited_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    email TEXT NOT NULL,
    invite_token TEXT UNIQUE NOT NULL,
    invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    first_login_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Criar tabela para permissões
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    invited_user_id UUID REFERENCES invited_users(id) ON DELETE CASCADE,
    section TEXT NOT NULL CHECK (section IN ('dashboard', 'leads', 'campaigns', 'sales', 'settings')),
    can_view BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    UNIQUE(invited_user_id, section)
);

-- Habilitar RLS
ALTER TABLE invited_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para invited_users
CREATE POLICY "Users can view invited users they created" ON invited_users
    FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can insert invited users" ON invited_users
    FOR INSERT WITH CHECK (invited_by = auth.uid());

CREATE POLICY "Users can update invited users they created" ON invited_users
    FOR UPDATE USING (invited_by = auth.uid());

CREATE POLICY "Users can delete invited users they created" ON invited_users
    FOR DELETE USING (invited_by = auth.uid());

-- Políticas RLS para user_permissions
CREATE POLICY "Users can view permissions for users they invited" ON user_permissions
    FOR SELECT USING (
        invited_user_id IN (
            SELECT id FROM invited_users WHERE invited_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert permissions for users they invited" ON user_permissions
    FOR INSERT WITH CHECK (
        invited_user_id IN (
            SELECT id FROM invited_users WHERE invited_by = auth.uid()
        )
    );

CREATE POLICY "Users can update permissions for users they invited" ON user_permissions
    FOR UPDATE USING (
        invited_user_id IN (
            SELECT id FROM invited_users WHERE invited_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete permissions for users they invited" ON user_permissions
    FOR DELETE USING (
        invited_user_id IN (
            SELECT id FROM invited_users WHERE invited_by = auth.uid()
        )
    );

-- Criar índices para performance
CREATE INDEX idx_invited_users_token ON invited_users(invite_token);
CREATE INDEX idx_invited_users_email ON invited_users(email);
CREATE INDEX idx_user_permissions_user_section ON user_permissions(invited_user_id, section);
