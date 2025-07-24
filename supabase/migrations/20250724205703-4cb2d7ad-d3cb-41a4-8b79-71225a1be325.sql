-- Fix remaining function security warnings by adding SET search_path

CREATE OR REPLACE FUNCTION public.apply_global_keywords_to_campaign(campaign_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  global_settings RECORD;
BEGIN
  -- Buscar configurações globais do usuário
  SELECT conversion_keywords, cancellation_keywords 
  INTO global_settings
  FROM public.global_keywords_settings 
  WHERE user_id = auth.uid();
  
  -- Se encontrou configurações globais, aplicar à campanha
  IF FOUND THEN
    UPDATE public.campaigns 
    SET 
      conversion_keywords = global_settings.conversion_keywords,
      cancellation_keywords = global_settings.cancellation_keywords
    WHERE id = campaign_id_param AND user_id = auth.uid();
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_apply_global_keywords()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  global_settings RECORD;
BEGIN
  -- Buscar configurações globais do usuário
  SELECT conversion_keywords, cancellation_keywords 
  INTO global_settings
  FROM public.global_keywords_settings 
  WHERE user_id = NEW.user_id;
  
  -- Se encontrou configurações globais, aplicar à nova campanha
  IF FOUND THEN
    NEW.conversion_keywords := global_settings.conversion_keywords;
    NEW.cancellation_keywords := global_settings.cancellation_keywords;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_project_settings(project_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.company_settings (
    user_id, 
    project_id,
    company_name, 
    company_subtitle, 
    theme
  )
  VALUES (
    auth.uid(),
    project_id_param,
    'Minha Empresa',
    'Sistema de Marketing Digital',
    'system'
  );
END;
$function$;