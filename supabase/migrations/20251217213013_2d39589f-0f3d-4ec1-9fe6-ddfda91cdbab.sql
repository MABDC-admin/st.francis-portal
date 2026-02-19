-- Create school_settings table
CREATE TABLE public.school_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id text NOT NULL UNIQUE DEFAULT 'default',
  name text NOT NULL DEFAULT 'School Name',
  acronym text,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  theme_id text DEFAULT 'default',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view school settings
CREATE POLICY "Anyone can view school settings"
ON public.school_settings
FOR SELECT
USING (true);

-- Only admins can modify school settings
CREATE POLICY "Admins can manage school settings"
ON public.school_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_school_settings_updated_at
BEFORE UPDATE ON public.school_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default school settings
INSERT INTO public.school_settings (school_id, name, acronym, address)
VALUES 
  ('MABDC', 'M.A Brain Development Center', 'MABDC', 'Dubai, UAE'),
  ('STFXSA', 'St. Francis Xavier Smart Academy Inc', 'STFXSA', 'Dubai, UAE');