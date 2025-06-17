
-- Criar tabela de clientes
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

-- Habilitar RLS na tabela de clientes
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Política para que usuários vejam apenas seus próprios clientes
CREATE POLICY "Users can view their own clients" 
  ON public.clients 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own clients" 
  ON public.clients 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients" 
  ON public.clients 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients" 
  ON public.clients 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Adicionar coluna client_id às tabelas existentes
ALTER TABLE public.leads ADD COLUMN client_id UUID REFERENCES public.clients(id);
ALTER TABLE public.campaigns ADD COLUMN client_id UUID REFERENCES public.clients(id);
ALTER TABLE public.sales ADD COLUMN client_id UUID REFERENCES public.clients(id);
ALTER TABLE public.company_settings ADD COLUMN client_id UUID REFERENCES public.clients(id);
