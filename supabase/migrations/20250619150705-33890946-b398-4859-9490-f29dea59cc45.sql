
-- Criar tabela para gerenciar instâncias Evolution automatizadas
CREATE TABLE public.evolution_auto_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  instance_name TEXT NOT NULL,
  instance_token TEXT,
  qr_code_base64 TEXT,
  connection_status TEXT DEFAULT 'pending',
  webhook_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, client_id, instance_name)
);

-- Habilitar RLS na tabela
ALTER TABLE public.evolution_auto_instances ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias instâncias
CREATE POLICY "Users can view their own evolution instances" 
  ON public.evolution_auto_instances 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias instâncias
CREATE POLICY "Users can create their own evolution instances" 
  ON public.evolution_auto_instances 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias instâncias
CREATE POLICY "Users can update their own evolution instances" 
  ON public.evolution_auto_instances 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias instâncias
CREATE POLICY "Users can delete their own evolution instances" 
  ON public.evolution_auto_instances 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_evolution_auto_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER evolution_auto_instances_updated_at
BEFORE UPDATE ON public.evolution_auto_instances
FOR EACH ROW EXECUTE FUNCTION public.update_evolution_auto_instances_updated_at();
