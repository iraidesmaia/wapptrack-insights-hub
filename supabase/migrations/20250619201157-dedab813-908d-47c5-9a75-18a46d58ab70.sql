
-- Remover tabelas não utilizadas no frontend
DROP TABLE IF EXISTS public.form_submissions CASCADE;
DROP TABLE IF EXISTS public.invited_users CASCADE;
DROP TABLE IF EXISTS public.user_permissions CASCADE;  
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.client_variables CASCADE;
DROP TABLE IF EXISTS public.client_evolution_settings CASCADE;
DROP TABLE IF EXISTS public.evolution_auto_instances CASCADE;
DROP TABLE IF EXISTS public.evolution_credentials CASCADE;
DROP TABLE IF EXISTS public.whatsapp_instances CASCADE;
DROP TABLE IF EXISTS public.utm_clicks CASCADE;

-- Remover funções não utilizadas
DROP FUNCTION IF EXISTS public.update_otp_expiry(integer) CASCADE;
DROP FUNCTION IF EXISTS public.update_otp_expiry() CASCADE;
DROP FUNCTION IF EXISTS public.update_evolution_auto_instances_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_client_variables_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_client_evolution_settings_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_evolution_credentials_updated_at() CASCADE;

-- Limpar referências em tabelas existentes que podem não ser mais necessárias
ALTER TABLE public.company_settings DROP COLUMN IF EXISTS client_id CASCADE;
ALTER TABLE public.campaigns DROP COLUMN IF EXISTS client_id CASCADE;
ALTER TABLE public.leads DROP COLUMN IF EXISTS client_id CASCADE;
ALTER TABLE public.sales DROP COLUMN IF EXISTS client_id CASCADE;

-- Garantir que as tabelas essenciais tenham as estruturas corretas
-- Atualizar tabela campaigns para garantir todos os campos necessários
ALTER TABLE public.campaigns 
  ALTER COLUMN conversion_keywords SET DEFAULT ARRAY[
    'obrigado pela compra',
    'obrigada pela compra', 
    'venda confirmada',
    'pedido aprovado',
    'parabéns pela aquisição',
    'compra realizada',
    'vendido',
    'venda fechada',
    'negócio fechado',
    'parabéns pela compra',
    'obrigado por comprar',
    'obrigada por comprar',
    'sua compra foi',
    'compra efetuada',
    'pedido confirmado'
  ];

ALTER TABLE public.campaigns 
  ALTER COLUMN cancellation_keywords SET DEFAULT ARRAY[
    'compra cancelada',
    'pedido cancelado',
    'cancelamento',
    'desistiu da compra',
    'não quer mais',
    'mudou de ideia',
    'cancelar pedido',
    'estorno',
    'devolver',
    'não conseguiu pagar'
  ];

-- Garantir RLS nas tabelas principais
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evolution_instances ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para campaigns
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage their own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para leads
DROP POLICY IF EXISTS "Users can manage their own leads" ON public.leads;
CREATE POLICY "Users can manage their own leads" ON public.leads
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para sales
DROP POLICY IF EXISTS "Users can manage their own sales" ON public.sales;
CREATE POLICY "Users can manage their own sales" ON public.sales
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para company_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.company_settings;
CREATE POLICY "Users can manage their own settings" ON public.company_settings
  FOR ALL USING (auth.uid() = user_id);

-- Políticas RLS para evolution_instances
DROP POLICY IF EXISTS "Users can manage their own instances" ON public.evolution_instances;
CREATE POLICY "Users can manage their own instances" ON public.evolution_instances
  FOR ALL USING (auth.uid() = user_id);

-- Manter tabelas essenciais:
-- - campaigns (gerenciamento de campanhas)
-- - leads (gerenciamento de leads)
-- - sales (vendas)
-- - company_settings (configurações da empresa)
-- - evolution_instances (instâncias Evolution API)
-- - profiles (perfis de usuário)
-- - device_data (dados de dispositivos)
-- - tracking_sessions (sessões de rastreamento)
-- - pending_leads (leads pendentes)

-- Comentários para documentar as tabelas mantidas
COMMENT ON TABLE public.campaigns IS 'Campanhas de marketing com configurações de pixel e palavras-chave';
COMMENT ON TABLE public.leads IS 'Leads capturados pelas campanhas';
COMMENT ON TABLE public.sales IS 'Vendas realizadas a partir dos leads';
COMMENT ON TABLE public.company_settings IS 'Configurações da empresa (nome, logo, tema)';
COMMENT ON TABLE public.evolution_instances IS 'Instâncias configuradas da Evolution API';
COMMENT ON TABLE public.device_data IS 'Dados de dispositivo dos usuários para rastreamento';
COMMENT ON TABLE public.tracking_sessions IS 'Sessões de rastreamento para correlação de dados';
COMMENT ON TABLE public.pending_leads IS 'Leads pendentes aguardando processamento';
COMMENT ON TABLE public.profiles IS 'Perfis de usuário';
