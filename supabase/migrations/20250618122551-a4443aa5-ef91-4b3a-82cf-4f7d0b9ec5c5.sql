
-- 1. Garantir que a tabela leads tenha todas as colunas necessárias
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS utm_source text,
ADD COLUMN IF NOT EXISTS utm_medium text,
ADD COLUMN IF NOT EXISTS utm_campaign text,
ADD COLUMN IF NOT EXISTS utm_content text,
ADD COLUMN IF NOT EXISTS utm_term text,
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS browser text,
ADD COLUMN IF NOT EXISTS os text,
ADD COLUMN IF NOT EXISTS device_type text,
ADD COLUMN IF NOT EXISTS device_model text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS screen_resolution text,
ADD COLUMN IF NOT EXISTS timezone text,
ADD COLUMN IF NOT EXISTS language text,
ADD COLUMN IF NOT EXISTS tracking_method text,
ADD COLUMN IF NOT EXISTS ad_account text,
ADD COLUMN IF NOT EXISTS ad_set_name text,
ADD COLUMN IF NOT EXISTS ad_name text,
ADD COLUMN IF NOT EXISTS initial_message text,
ADD COLUMN IF NOT EXISTS last_message text,
ADD COLUMN IF NOT EXISTS evolution_message_id text,
ADD COLUMN IF NOT EXISTS evolution_status text,
ADD COLUMN IF NOT EXISTS whatsapp_delivery_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_whatsapp_attempt timestamp with time zone;

-- 2. Garantir que pending_leads tenha todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.pending_leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id text NOT NULL,
  campaign_name text,
  name text NOT NULL,
  phone text NOT NULL,
  status text DEFAULT 'pending',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  webhook_sent_at timestamp with time zone,
  webhook_data jsonb
);

-- 3. Garantir que device_data tenha todas as colunas necessárias  
CREATE TABLE IF NOT EXISTS public.device_data (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  ip_address text,
  user_agent text,
  browser text,
  os text,
  device_type text,
  device_model text,
  location text,
  country text,
  city text,
  screen_resolution text,
  timezone text,
  language text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. Garantir que utm_clicks tenha todas as colunas necessárias
CREATE TABLE IF NOT EXISTS public.utm_clicks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 5. Habilitar RLS nas novas tabelas
ALTER TABLE public.pending_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_clicks ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS básicas para pending_leads
DROP POLICY IF EXISTS "Allow all access to pending_leads" ON public.pending_leads;
CREATE POLICY "Allow all access to pending_leads" 
  ON public.pending_leads 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 7. Criar políticas RLS básicas para device_data
DROP POLICY IF EXISTS "Allow all access to device_data" ON public.device_data;
CREATE POLICY "Allow all access to device_data" 
  ON public.device_data 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 8. Criar políticas RLS básicas para utm_clicks
DROP POLICY IF EXISTS "Allow all access to utm_clicks" ON public.utm_clicks;
CREATE POLICY "Allow all access to utm_clicks" 
  ON public.utm_clicks 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 9. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pending_leads_phone ON public.pending_leads(phone);
CREATE INDEX IF NOT EXISTS idx_pending_leads_status ON public.pending_leads(status);
CREATE INDEX IF NOT EXISTS idx_device_data_phone ON public.device_data(phone);
CREATE INDEX IF NOT EXISTS idx_utm_clicks_phone ON public.utm_clicks(phone);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON public.leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON public.leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- 10. Corrigir problema de company_settings múltiplos
-- Deletar registros duplicados mantendo apenas o mais recente para cada user_id
DELETE FROM public.company_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM public.company_settings 
  ORDER BY user_id, created_at DESC
);

-- 11. Garantir que user_id seja único em company_settings
ALTER TABLE public.company_settings 
DROP CONSTRAINT IF EXISTS unique_user_company_settings;

ALTER TABLE public.company_settings 
ADD CONSTRAINT unique_user_company_settings UNIQUE (user_id);
