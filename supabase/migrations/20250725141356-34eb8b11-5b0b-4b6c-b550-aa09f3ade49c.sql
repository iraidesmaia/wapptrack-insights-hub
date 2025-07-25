-- Create a public policy for viewing active campaigns (for redirect page)
CREATE POLICY "Public can view active campaigns for redirection" 
ON public.campaigns 
FOR SELECT 
USING (active = true);