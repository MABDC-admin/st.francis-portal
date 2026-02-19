
-- Create zoom_settings table for storing meeting configuration per school
CREATE TABLE public.zoom_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  meeting_url TEXT,
  meeting_id TEXT,
  meeting_password TEXT,
  breakout_rooms JSONB DEFAULT '[]'::jsonb,
  schedule_start TIME NOT NULL DEFAULT '07:30:00',
  schedule_end TIME NOT NULL DEFAULT '17:30:00',
  timezone TEXT NOT NULL DEFAULT 'Asia/Dubai',
  active_days INT[] NOT NULL DEFAULT '{1,2,3,4,5}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id)
);

-- Enable RLS
ALTER TABLE public.zoom_settings ENABLE ROW LEVEL SECURITY;

-- Admin and Registrar: full access for their school
CREATE POLICY "Admin/Registrar can manage zoom settings"
ON public.zoom_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
  )
);

-- Teachers and Students: read-only access
CREATE POLICY "Authenticated users can view zoom settings"
ON public.zoom_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_zoom_settings_updated_at
BEFORE UPDATE ON public.zoom_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
