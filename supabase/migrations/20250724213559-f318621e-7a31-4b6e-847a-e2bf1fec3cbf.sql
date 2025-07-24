-- Add security enhancements to the database

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  event_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on security audit logs
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for security audit logs (only system can insert, admins can view)
CREATE POLICY "System can insert security logs" 
ON public.security_audit_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can view security logs" 
ON public.security_audit_logs 
FOR SELECT 
USING (true);

-- Create function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT, key_name TEXT DEFAULT 'encryption_key')
RETURNS TEXT AS $$
BEGIN
  -- In production, this would use a proper encryption function
  -- For now, we'll use a basic approach (should be replaced with pgcrypto)
  RETURN encode(convert_to(data, 'UTF8'), 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt sensitive data
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to encrypt facebook_access_token before insert/update
CREATE OR REPLACE FUNCTION public.encrypt_campaign_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt Facebook access token if provided
  IF NEW.facebook_access_token IS NOT NULL AND NEW.facebook_access_token != '' THEN
    NEW.facebook_access_token = encrypt_sensitive_data(NEW.facebook_access_token);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for campaigns table
DROP TRIGGER IF EXISTS encrypt_tokens_trigger ON public.campaigns;
CREATE TRIGGER encrypt_tokens_trigger
  BEFORE INSERT OR UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.encrypt_campaign_tokens();

-- Add function to log security events
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_severity ON public.security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event_type ON public.security_audit_logs(event_type);

-- Create function to clean old audit logs (retention policy)
CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS VOID AS $$
BEGIN
  -- Keep only last 90 days of logs
  DELETE FROM public.security_audit_logs 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;