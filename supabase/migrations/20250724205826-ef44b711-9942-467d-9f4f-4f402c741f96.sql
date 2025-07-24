-- Fix the remaining trigger functions

CREATE OR REPLACE FUNCTION public.update_utm_sessions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_facebook_mappings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_default_company_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.company_settings (user_id, company_name, company_subtitle, theme)
  VALUES (
    NEW.id,
    'Minha Empresa',
    'Sistema de Marketing Digital',
    'system'
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  PERFORM create_default_project_settings(NEW.id);
  RETURN NEW;
END;
$function$;