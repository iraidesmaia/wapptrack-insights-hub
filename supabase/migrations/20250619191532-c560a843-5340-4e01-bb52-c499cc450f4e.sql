
-- Adicionar constraint única para permitir o onConflict funcionar corretamente
ALTER TABLE public.evolution_auto_instances 
ADD CONSTRAINT unique_user_instance_name UNIQUE (user_id, instance_name);
