
INSERT INTO storage.buckets (id, name, public) VALUES ('school-gallery', 'school-gallery', true);

CREATE POLICY "Authenticated users can upload school gallery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-gallery');

CREATE POLICY "Public can view school gallery photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'school-gallery');

CREATE POLICY "Authenticated users can delete school gallery photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-gallery');
