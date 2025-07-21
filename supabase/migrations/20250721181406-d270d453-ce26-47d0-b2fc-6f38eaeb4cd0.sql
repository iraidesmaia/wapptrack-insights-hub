
-- Criar tabela utm_sessions para armazenamento temporário de dados UTM
CREATE TABLE public.utm_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL UNIQUE,
  phone TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  landing_page TEXT,
  status TEXT DEFAULT 'pending',
  matched_lead_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours')
);

-- Criar índices para otimizar consultas
CREATE INDEX idx_utm_sessions_phone ON public.utm_sessions(phone);
CREATE INDEX idx_utm_sessions_session_id ON public.utm_sessions(session_id);
CREATE INDEX idx_utm_sessions_status ON public.utm_sessions(status);
CREATE INDEX idx_utm_sessions_expires_at ON public.utm_sessions(expires_at);

-- Adicionar campos à tabela leads existente
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm_session_id TEXT,
ADD COLUMN IF NOT EXISTS landing_page TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS confidence_score INTEGER,
ADD COLUMN IF NOT EXISTS data_sources TEXT[],
ADD COLUMN IF NOT EXISTS tracking_method TEXT;

-- Configurar RLS para utm_sessions
ALTER TABLE public.utm_sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserção de sessões UTM (público para Edge Functions)
CREATE POLICY "Allow utm_sessions insertion" 
ON public.utm_sessions 
FOR INSERT 
WITH CHECK (true);

-- Política para permitir leitura de sessões UTM (público para Edge Functions)
CREATE POLICY "Allow utm_sessions read" 
ON public.utm_sessions 
FOR SELECT 
USING (true);

-- Política para permitir atualização de sessões UTM (público para Edge Functions)
CREATE POLICY "Allow utm_sessions update" 
ON public.utm_sessions 
FOR UPDATE 
USING (true);

-- Função para limpeza automática de sessões expiradas
CREATE OR REPLACE FUNCTION public.cleanup_expired_utm_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.utm_sessions 
  WHERE expires_at < now() AND status = 'pending';
END;
$$;

-- Trigger para atualização automática do campo updated_at
CREATE OR REPLACE FUNCTION public.update_utm_sessions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER utm_sessions_updated_at
BEFORE UPDATE ON public.utm_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_utm_sessions_updated_at();
