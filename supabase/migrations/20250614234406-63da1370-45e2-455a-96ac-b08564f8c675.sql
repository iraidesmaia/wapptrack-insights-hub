
-- Create storage bucket for campaign logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-logos', 'campaign-logos', true);

-- Create storage policies for campaign logos
CREATE POLICY "Anyone can view campaign logos" ON storage.objects
FOR SELECT USING (bucket_id = 'campaign-logos');

CREATE POLICY "Anyone can upload campaign logos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'campaign-logos');

CREATE POLICY "Anyone can update campaign logos" ON storage.objects
FOR UPDATE USING (bucket_id = 'campaign-logos');

CREATE POLICY "Anyone can delete campaign logos" ON storage.objects
FOR DELETE USING (bucket_id = 'campaign-logos');
