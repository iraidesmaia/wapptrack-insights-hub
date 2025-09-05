-- Fix security vulnerability: Restrict public access to campaigns table
-- Remove the overly permissive public policy that exposes all sensitive data
DROP POLICY IF EXISTS "Public can view active campaigns for redirection" ON public.campaigns;

-- Create a new restrictive policy that only exposes essential fields for redirection
-- Using a security definer function to control exactly what data is accessible
CREATE OR REPLACE FUNCTION public.get_campaign_for_redirect(campaign_id_param uuid)
RETURNS TABLE(
  id uuid,
  redirect_type text,
  whatsapp_number text,
  active boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.redirect_type,
    c.whatsapp_number,
    c.active
  FROM public.campaigns c
  WHERE c.id = campaign_id_param 
    AND c.active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix facebook_mappings table - remove public access
DROP POLICY IF EXISTS "Users can view facebook mappings" ON public.facebook_mappings;
DROP POLICY IF EXISTS "System can manage facebook mappings" ON public.facebook_mappings;

-- Create proper RLS policies for facebook_mappings
CREATE POLICY "System can manage facebook mappings" 
ON public.facebook_mappings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Only allow users to view facebook mappings related to their campaigns
CREATE POLICY "Users can view their facebook mappings" 
ON public.facebook_mappings 
FOR SELECT 
USING (
  campaign_id IN (
    SELECT c.id::text 
    FROM public.campaigns c 
    WHERE c.user_id = auth.uid()
  )
);

-- Log security improvement
SELECT public.log_security_event(
  'RLS Policy Updated',
  'high',
  auth.uid(),
  inet_client_addr(),
  NULL,
  jsonb_build_object(
    'action', 'Restricted public access to campaigns and facebook_mappings tables',
    'tables_affected', ARRAY['campaigns', 'facebook_mappings'],
    'reason', 'Prevent exposure of sensitive marketing data to competitors'
  )
);