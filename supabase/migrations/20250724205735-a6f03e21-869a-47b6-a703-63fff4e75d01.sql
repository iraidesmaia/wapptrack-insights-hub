-- Fix the remaining functions with missing search_path

CREATE OR REPLACE FUNCTION public.select_from_tracking_sessions(
  where_clause text DEFAULT ''::text, 
  order_by text DEFAULT 'created_at DESC'::text, 
  limit_count integer DEFAULT 100
)
RETURNS TABLE(
  id uuid, 
  session_id text, 
  browser_fingerprint text, 
  ip_address text, 
  user_agent text, 
  campaign_id text, 
  utm_source text, 
  utm_medium text, 
  utm_campaign text, 
  utm_content text, 
  utm_term text, 
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  query_text TEXT;
BEGIN
  query_text := 'SELECT id, session_id, browser_fingerprint, ip_address, user_agent, ' ||
                'campaign_id, utm_source, utm_medium, utm_campaign, utm_content, utm_term, created_at ' ||
                'FROM public.tracking_sessions';
  
  IF where_clause != '' THEN
    query_text := query_text || ' WHERE ' || where_clause;
  END IF;
  
  IF order_by != '' THEN
    query_text := query_text || ' ORDER BY ' || order_by;
  END IF;
  
  IF limit_count > 0 THEN
    query_text := query_text || ' LIMIT ' || limit_count;
  END IF;
  
  RETURN QUERY EXECUTE query_text;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_utm_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  DELETE FROM public.utm_sessions 
  WHERE expires_at < now() AND status = 'pending';
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$function$;