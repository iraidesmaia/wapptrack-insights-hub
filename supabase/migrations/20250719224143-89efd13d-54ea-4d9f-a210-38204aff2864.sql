-- Add click_id column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN click_id text UNIQUE;