-- Criar tabela facebook_mappings para mapear source_id com dados detalhados da campanha
CREATE TABLE public.facebook_mappings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_id TEXT UNIQUE NOT NULL,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  ad_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Criar índice para performance nas consultas por source_id
CREATE INDEX idx_facebook_mappings_source_id ON public.facebook_mappings(source_id);

-- Habilitar RLS
ALTER TABLE public.facebook_mappings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para permitir acesso às funções
CREATE POLICY "Allow all access to facebook_mappings" ON public.facebook_mappings FOR ALL USING (true);

-- Popular com dados de exemplo do source_id identificado
INSERT INTO public.facebook_mappings (
  source_id, campaign_id, campaign_name, adset_id, ad_name
) VALUES (
  '120229024722220264',
  'fb_camp_enerzee_2024',
  'ENERZEE - Solução de Economia de Energia',
  'fb_adset_enerzee_ctwa',
  'Mensagem CTWA - Energia Solar Gratuita'
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_facebook_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_facebook_mappings_updated_at
  BEFORE UPDATE ON public.facebook_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_facebook_mappings_updated_at();