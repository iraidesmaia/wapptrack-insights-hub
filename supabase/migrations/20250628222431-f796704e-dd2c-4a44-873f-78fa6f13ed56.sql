
-- Adicionar novos campos de tracking à tabela device_data
ALTER TABLE public.device_data 
ADD COLUMN IF NOT EXISTS source_id text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS ctwa_clid text;

-- Adicionar novos campos de tracking à tabela tracking_sessions
ALTER TABLE public.tracking_sessions 
ADD COLUMN IF NOT EXISTS source_id text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS ctwa_clid text;

-- Adicionar novos campos de tracking à tabela leads
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS source_id text,
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS ctwa_clid text;

-- Comentários para documentação
COMMENT ON COLUMN public.device_data.source_id IS 'ID da fonte de tráfego para tracking avançado';
COMMENT ON COLUMN public.device_data.media_url IS 'URL da mídia associada ao tráfego';
COMMENT ON COLUMN public.device_data.ctwa_clid IS 'Click-to-WhatsApp Click ID do Meta/Facebook';

COMMENT ON COLUMN public.tracking_sessions.source_id IS 'ID da fonte de tráfego para tracking avançado';
COMMENT ON COLUMN public.tracking_sessions.media_url IS 'URL da mídia associada ao tráfego';
COMMENT ON COLUMN public.tracking_sessions.ctwa_clid IS 'Click-to-WhatsApp Click ID do Meta/Facebook';

COMMENT ON COLUMN public.leads.source_id IS 'ID da fonte de tráfego para tracking avançado';
COMMENT ON COLUMN public.leads.media_url IS 'URL da mídia associada ao tráfego';
COMMENT ON COLUMN public.leads.ctwa_clid IS 'Click-to-WhatsApp Click ID do Meta/Facebook';
