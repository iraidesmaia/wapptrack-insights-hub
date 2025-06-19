
-- Criar tabela de projetos
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS na tabela projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projects
CREATE POLICY "Users can view their own projects" 
  ON public.projects 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON public.projects 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON public.projects 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar project_id às tabelas existentes
ALTER TABLE public.leads ADD COLUMN project_id UUID;
ALTER TABLE public.campaigns ADD COLUMN project_id UUID;
ALTER TABLE public.sales ADD COLUMN project_id UUID;
ALTER TABLE public.company_settings ADD COLUMN project_id UUID;

-- Criar índices para performance
CREATE INDEX idx_leads_project_id ON public.leads(project_id);
CREATE INDEX idx_campaigns_project_id ON public.campaigns(project_id);
CREATE INDEX idx_sales_project_id ON public.sales(project_id);
CREATE INDEX idx_company_settings_project_id ON public.company_settings(project_id);

-- Atualizar políticas RLS existentes para incluir project_id
-- Leads
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;

CREATE POLICY "Users can view leads from their projects" 
  ON public.leads 
  FOR SELECT 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create leads in their projects" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update leads in their projects" 
  ON public.leads 
  FOR UPDATE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete leads in their projects" 
  ON public.leads 
  FOR DELETE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;

CREATE POLICY "Users can view campaigns from their projects" 
  ON public.campaigns 
  FOR SELECT 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create campaigns in their projects" 
  ON public.campaigns 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update campaigns in their projects" 
  ON public.campaigns 
  FOR UPDATE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete campaigns in their projects" 
  ON public.campaigns 
  FOR DELETE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Sales
DROP POLICY IF EXISTS "Users can view their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can create their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can update their own sales" ON public.sales;
DROP POLICY IF EXISTS "Users can delete their own sales" ON public.sales;

CREATE POLICY "Users can view sales from their projects" 
  ON public.sales 
  FOR SELECT 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create sales in their projects" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update sales in their projects" 
  ON public.sales 
  FOR UPDATE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete sales in their projects" 
  ON public.sales 
  FOR DELETE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Company Settings
DROP POLICY IF EXISTS "Users can view their own company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can create their own company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update their own company_settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can delete their own company_settings" ON public.company_settings;

CREATE POLICY "Users can view company_settings from their projects" 
  ON public.company_settings 
  FOR SELECT 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create company_settings in their projects" 
  ON public.company_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update company_settings in their projects" 
  ON public.company_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete company_settings in their projects" 
  ON public.company_settings 
  FOR DELETE 
  USING (auth.uid() = user_id AND project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Função para criar configurações padrão de um projeto
CREATE OR REPLACE FUNCTION public.create_default_project_settings(project_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.company_settings (
    user_id, 
    project_id,
    company_name, 
    company_subtitle, 
    theme
  )
  VALUES (
    auth.uid(),
    project_id_param,
    'Minha Empresa',
    'Sistema de Marketing Digital',
    'system'
  );
END;
$$;

-- Trigger para criar configurações padrão automaticamente quando um projeto é criado
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM create_default_project_settings(NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_created
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_project();
