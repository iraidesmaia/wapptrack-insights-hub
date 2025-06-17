
-- Criar tabela para armazenar credenciais da Evolution API por usuário
CREATE TABLE public.evolution_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  instance_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  validated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS para segurança
ALTER TABLE public.evolution_credentials ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem apenas suas próprias credenciais
CREATE POLICY "Users can view their own evolution credentials" 
  ON public.evolution_credentials 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para usuários criarem suas próprias credenciais
CREATE POLICY "Users can create their own evolution credentials" 
  ON public.evolution_credentials 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para usuários atualizarem suas próprias credenciais
CREATE POLICY "Users can update their own evolution credentials" 
  ON public.evolution_credentials 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para usuários deletarem suas próprias credenciais
CREATE POLICY "Users can delete their own evolution credentials" 
  ON public.evolution_credentials 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_evolution_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_evolution_credentials_updated_at
  BEFORE UPDATE ON public.evolution_credentials
  FOR EACH ROW EXECUTE FUNCTION update_evolution_credentials_updated_at();
