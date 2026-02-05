-- Create flipbooks table for Library integration
CREATE TABLE public.flipbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  flipbook_url TEXT NOT NULL,
  grade_levels TEXT[] NOT NULL,
  school TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.flipbooks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone authenticated can view active flipbooks
CREATE POLICY "Users can view active flipbooks"
  ON public.flipbooks FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Policy: Admins can manage flipbooks
CREATE POLICY "Admins can manage flipbooks"
  ON public.flipbooks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Registrars can manage flipbooks
CREATE POLICY "Registrars can manage flipbooks"
  ON public.flipbooks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'registrar'));

-- Add updated_at trigger
CREATE TRIGGER update_flipbooks_updated_at
  BEFORE UPDATE ON public.flipbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();