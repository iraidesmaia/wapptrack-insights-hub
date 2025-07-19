-- Add click_id column to tracking_sessions table
ALTER TABLE public.tracking_sessions 
ADD COLUMN click_id text;