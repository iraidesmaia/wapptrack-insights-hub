
-- Criar tabela para variáveis personalizadas por cliente
CREATE TABLE public.client_variables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  variable_name TEXT NOT NULL,
  variable_value TEXT,
  variable_type TEXT DEFAULT 'text' CHECK (variable_type IN ('text', 'number', 'boolean', 'url')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, variable_name)
);

-- Criar tabela para configurações Evolution por cliente
CREATE TABLE public.client_evolution_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users NOT NULL,
  evolution_api_key TEXT,
  evolution_instance_name TEXT,
  evolution_base_url TEXT,
  webhook_callback_url TEXT,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);

-- Modificar company_settings para incluir client_id
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE;

-- Habilitar RLS nas novas tabelas
ALTER TABLE public.client_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_evolution_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para client_variables
CREATE POLICY "Users can view their own client variables" 
  ON public.client_variables 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own client variables" 
  ON public.client_variables 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client variables" 
  ON public.client_variables 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client variables" 
  ON public.client_variables 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Políticas RLS para client_evolution_settings
CREATE POLICY "Users can view their own client evolution settings" 
  ON public.client_evolution_settings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own client evolution settings" 
  ON public.client_evolution_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own client evolution settings" 
  ON public.client_evolution_settings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own client evolution settings" 
  ON public.client_evolution_settings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_client_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_client_evolution_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_variables_updated_at
  BEFORE UPDATE ON public.client_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_client_variables_updated_at();

CREATE TRIGGER client_evolution_settings_updated_at
  BEFORE UPDATE ON public.client_evolution_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_client_evolution_settings_updated_at();
