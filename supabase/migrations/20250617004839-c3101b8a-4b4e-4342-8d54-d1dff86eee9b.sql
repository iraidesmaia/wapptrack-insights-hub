
-- Remover todas as políticas INSERT existentes que estão causando conflito
DROP POLICY IF EXISTS "Users can insert invited users" ON invited_users;
DROP POLICY IF EXISTS "Users can create invited users" ON invited_users;

-- Garantir que o campo invited_by não seja nullable (se ainda não foi feito)
ALTER TABLE invited_users ALTER COLUMN invited_by SET NOT NULL;

-- Criar uma única política INSERT limpa e clara
CREATE POLICY "Users can create invites" ON invited_users
    FOR INSERT 
    WITH CHECK (invited_by = auth.uid());

-- Verificar e ajustar as outras políticas se necessário
DROP POLICY IF EXISTS "Users can view invited users they created" ON invited_users;
CREATE POLICY "Users can view their invited users" ON invited_users
    FOR SELECT 
    USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can update invited users they created" ON invited_users;
CREATE POLICY "Users can update their invited users" ON invited_users
    FOR UPDATE 
    USING (invited_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete invited users they created" ON invited_users;
CREATE POLICY "Users can delete their invited users" ON invited_users
    FOR DELETE 
    USING (invited_by = auth.uid());
