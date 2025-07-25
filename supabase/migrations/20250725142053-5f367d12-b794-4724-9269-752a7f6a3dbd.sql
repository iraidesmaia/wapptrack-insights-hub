-- Allow system to insert leads without authentication (for webhook/tracking)
CREATE POLICY "System can insert leads for tracking" 
ON public.leads 
FOR INSERT 
WITH CHECK (user_id IS NOT NULL AND user_id != '00000000-0000-0000-0000-000000000000'::uuid);

-- Update the tracking service policy to be more permissive
DROP POLICY IF EXISTS "Allow lead insertion with valid user_id" ON public.leads;

CREATE POLICY "Allow tracking lead insertion" 
ON public.leads 
FOR INSERT 
WITH CHECK (
  user_id IS NOT NULL AND 
  user_id != '00000000-0000-0000-0000-000000000000'::uuid AND
  tracking_method IS NOT NULL
);