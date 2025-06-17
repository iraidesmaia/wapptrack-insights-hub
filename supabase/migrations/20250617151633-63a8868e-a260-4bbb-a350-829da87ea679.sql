
-- Primeiro, adicionar a coluna user_id como nullable
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.company_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Obter o primeiro usuário do sistema para atribuir dados existentes
-- (Em produção, você deveria fazer isso manualmente para cada cliente)
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- Pegar o primeiro usuário autenticado
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    -- Se existir usuário, atribuir dados existentes a ele
    IF first_user_id IS NOT NULL THEN
        UPDATE public.campaigns SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.leads SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.sales SET user_id = first_user_id WHERE user_id IS NULL;
        UPDATE public.company_settings SET user_id = first_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- Agora definir valores padrão para user_id baseado no usuário autenticado
ALTER TABLE public.campaigns ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.leads ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.sales ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.company_settings ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Tornar user_id obrigatório (após atribuir valores aos existentes)
ALTER TABLE public.campaigns ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.leads ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.sales ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.company_settings ALTER COLUMN user_id SET NOT NULL;

-- Habilitar RLS em todas as tabelas principais
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para campaigns
CREATE POLICY "Users can view their own campaigns" 
  ON public.campaigns 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" 
  ON public.campaigns 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" 
  ON public.campaigns 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para leads
CREATE POLICY "Users can view their own leads" 
  ON public.leads 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own leads" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads" 
  ON public.leads 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads" 
  ON public.leads 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para sales
CREATE POLICY "Users can view their own sales" 
  ON public.sales 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sales" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales" 
  ON public.sales 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales" 
  ON public.sales 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para company_settings
CREATE POLICY "Users can view their own settings" 
  ON public.company_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settings" 
  ON public.company_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
  ON public.company_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settings" 
  ON public.company_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Função para criar configurações padrão para novos usuários
CREATE OR REPLACE FUNCTION public.create_default_company_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.company_settings (user_id, company_name, company_subtitle, theme)
  VALUES (
    NEW.id,
    'Minha Empresa',
    'Sistema de Marketing Digital',
    'system'
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar configurações padrão automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_company_settings();
