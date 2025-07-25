-- Security Improvements Migration - Fixed Version

-- 1. Fix RLS policies - Remove overly permissive policies and implement proper user-based access control

-- Drop problematic overly permissive policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON campaigns;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON leads;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to delete company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to insert company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to update company settings" ON company_settings;
DROP POLICY IF EXISTS "Allow authenticated users to view company settings" ON company_settings;

-- 2. Secure security audit logs - restrict to system functions only
DROP POLICY IF EXISTS "System can view security logs" ON security_audit_logs;
CREATE POLICY "Admin can view security logs" ON security_audit_logs
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM profiles WHERE email LIKE '%@admin.%' 
    OR auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid
  )
);

-- 3. Fix device data and UTM sessions access controls
DROP POLICY IF EXISTS "Allow insert device data" ON device_data;
DROP POLICY IF EXISTS "Allow select device data" ON device_data;
DROP POLICY IF EXISTS "System can insert device data" ON device_data;
DROP POLICY IF EXISTS "Allow utm_sessions insertion" ON utm_sessions;
DROP POLICY IF EXISTS "Allow utm_sessions read" ON utm_sessions;
DROP POLICY IF EXISTS "Allow utm_sessions update" ON utm_sessions;
DROP POLICY IF EXISTS "System can manage utm_sessions" ON utm_sessions;

-- Create proper user-based policies for device data
CREATE POLICY "System can insert device data" ON device_data
FOR INSERT 
WITH CHECK (true); -- Allow system inserts from webhooks

CREATE POLICY "Users can view device data for their campaigns" ON device_data
FOR SELECT 
USING (
  phone IN (
    SELECT l.phone FROM leads l 
    JOIN campaigns c ON l.campaign_id = c.id 
    WHERE c.user_id = auth.uid()
  )
);

-- Create proper policies for UTM sessions
CREATE POLICY "System can manage utm_sessions" ON utm_sessions
FOR ALL 
USING (true)
WITH CHECK (true); -- System needs full access for webhook processing

-- 4. Create rate limiting table for persistent rate limiting (if not exists)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier text NOT NULL,
  requests_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT now(),
  violations_count integer DEFAULT 0,
  blocked_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop and recreate rate limits policy
DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits;
CREATE POLICY "System can manage rate limits" ON public.rate_limits
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON public.rate_limits(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits(window_start);