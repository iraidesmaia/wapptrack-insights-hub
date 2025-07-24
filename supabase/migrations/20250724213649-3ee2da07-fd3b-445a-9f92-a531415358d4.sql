-- Fix function search path security warnings
-- Update all security definer functions to have secure search_path

-- Fix encrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT, key_name TEXT DEFAULT 'encryption_key')
RETURNS TEXT AS $$
BEGIN
  -- In production, this would use a proper encryption function
  -- For now, we'll use a basic approach (should be replaced with pgcrypto)
  RETURN encode(convert_to(data, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix decrypt_sensitive_data function
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT, key_name TEXT DEFAULT 'encryption_key')
RETURNS TEXT AS $$
BEGIN
  -- In production, this would use proper decryption
  -- For now, we'll use basic decoding (should be replaced with pgcrypto)
  RETURN convert_from(decode(encrypted_data, 'base64'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL; -- Return NULL if decryption fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix encrypt_campaign_tokens function
CREATE OR REPLACE FUNCTION public.encrypt_campaign_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt Facebook access token if provided
  IF NEW.facebook_access_token IS NOT NULL AND NEW.facebook_access_token != '' THEN
    NEW.facebook_access_token = encrypt_sensitive_data(NEW.facebook_access_token);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type_param TEXT,
  severity_param TEXT,
  user_id_param UUID DEFAULT NULL,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL,
  event_details_param JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.security_audit_logs (
    event_type,
    severity,
    user_id,
    ip_address,
    user_agent,
    event_details
  ) VALUES (
    event_type_param,
    severity_param,
    user_id_param,
    ip_address_param,
    user_agent_param,
    event_details_param
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix cleanup_old_audit_logs function
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS VOID AS $$
BEGIN
  -- Keep only last 90 days of logs
  DELETE FROM public.security_audit_logs 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;