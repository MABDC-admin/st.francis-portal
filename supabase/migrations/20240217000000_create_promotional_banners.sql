-- Create promotional_banners table
CREATE TABLE IF NOT EXISTS public.promotional_banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key relationship if academic_year_id is needed (optional, keeping it global to school)
-- ALTER TABLE public.promotional_banners ADD COLUMN academic_year_id UUID REFERENCES public.academic_years(id);

-- Enable RLS
ALTER TABLE public.promotional_banners ENABLE ROW LEVEL SECURITY;

-- Allow public read access (or student-specific)
CREATE POLICY "Allow public read access to active banners" 
ON public.promotional_banners FOR SELECT 
USING (is_active = true);

-- Allow admin full access
CREATE POLICY "Allow admin full access to banners" 
ON public.promotional_banners FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
