
-- Remover tabela de instâncias Evolution API
DROP TABLE IF EXISTS public.evolution_instances CASCADE;

-- Remover tabela de leads pendentes
DROP TABLE IF EXISTS public.pending_leads CASCADE;

-- Remover função relacionada à conversão de leads pendentes
DROP FUNCTION IF EXISTS public.convert_pending_lead_secure(uuid);

-- Remover função relacionada à conversão em lote de leads pendentes
DROP FUNCTION IF EXISTS public.convert_all_pending_leads();

-- Remover função para buscar usuário por instância
DROP FUNCTION IF EXISTS public.get_user_by_instance(text);

-- Remover função de trigger para atualizar evolution_instances
DROP FUNCTION IF EXISTS public.update_evolution_instances_updated_at();

-- Remover campos relacionados à Evolution API da tabela campaigns
ALTER TABLE public.campaigns 
DROP COLUMN IF EXISTS evolution_api_key,
DROP COLUMN IF EXISTS evolution_instance_name,
DROP COLUMN IF EXISTS evolution_base_url,
DROP COLUMN IF EXISTS webhook_callback_url,
DROP COLUMN IF EXISTS auto_create_leads;

-- Remover campos relacionados à Evolution API da tabela leads
ALTER TABLE public.leads 
DROP COLUMN IF EXISTS evolution_message_id,
DROP COLUMN IF EXISTS evolution_status;
