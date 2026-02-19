
DROP POLICY IF EXISTS "Allow public read access to active banners" ON public.promotional_banners;
DROP POLICY IF EXISTS "Allow admin full access to banners" ON public.promotional_banners;

CREATE POLICY "Allow public read access to active banners" 
ON public.promotional_banners FOR SELECT 
USING (is_active = true);

CREATE POLICY "Allow admin full access to banners" 
ON public.promotional_banners FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
