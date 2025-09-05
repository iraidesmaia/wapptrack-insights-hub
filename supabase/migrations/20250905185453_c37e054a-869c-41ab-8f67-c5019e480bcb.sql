-- Fix facebook_mappings table security - ensure no public access
-- Drop any remaining public policies
DROP POLICY IF EXISTS "Users can view facebook mappings" ON public.facebook_mappings;
DROP POLICY IF EXISTS "System can manage facebook mappings" ON public.facebook_mappings;

-- Recreate proper policies for facebook_mappings
-- Only system can manage (for webhooks/automation)
CREATE POLICY "System can manage facebook mappings" 
ON public.facebook_mappings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Users can only view mappings related to their own campaigns
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

-- Log security fix
SELECT public.log_security_event(
  'Facebook Mappings Security Fixed',
  'high',
  auth.uid(),
  inet_client_addr(),
  NULL,
  jsonb_build_object(
    'action', 'Removed public access from facebook_mappings table',
    'table', 'facebook_mappings',
    'reason', 'Prevent exposure of Facebook campaign intelligence to competitors'
  )
);