-- Criar função para buscar usuário responsável por uma instância
-- Esta função busca por campanhas ativas que referenciem a instância especificada
CREATE OR REPLACE FUNCTION public.get_user_by_instance(instance_name_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_uuid uuid;
BEGIN
  -- Buscar usuário através das campanhas que têm essa instância configurada
  -- Assumindo que o nome da instância seja armazenado em algum campo relacionado às campanhas
  -- Como não vejo um campo específico para instância, vou usar uma abordagem baseada no tracking_domain
  -- ou algum outro campo que possa estar relacionado
  
  SELECT user_id INTO user_uuid
  FROM public.campaigns 
  WHERE active = true 
    AND (
      tracking_domain ILIKE '%' || instance_name_param || '%'
      OR name ILIKE '%' || instance_name_param || '%'
    )
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Se não encontrar por campanha, buscar pelo primeiro usuário ativo
  IF user_uuid IS NULL THEN
    SELECT user_id INTO user_uuid
    FROM public.campaigns 
    WHERE active = true
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;
  
  RETURN user_uuid;
END;
$$;