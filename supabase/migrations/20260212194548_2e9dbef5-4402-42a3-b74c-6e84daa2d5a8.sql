
-- Create online_registrations table
CREATE TABLE public.online_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  lrn TEXT,
  level TEXT NOT NULL,
  strand TEXT,
  birth_date DATE,
  gender TEXT,
  mother_maiden_name TEXT,
  mother_contact TEXT,
  father_name TEXT,
  father_contact TEXT,
  phil_address TEXT,
  uae_address TEXT,
  previous_school TEXT,
  parent_email TEXT,
  mother_tongue TEXT,
  dialects TEXT,
  school_id UUID NOT NULL,
  academic_year_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.online_registrations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin can manage online_registrations"
ON public.online_registrations
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Registrar full access
CREATE POLICY "Registrar can manage online_registrations"
ON public.online_registrations
FOR ALL
USING (has_role(auth.uid(), 'registrar'::app_role));

-- Public insert (only pending status)
CREATE POLICY "Public can submit registrations"
ON public.online_registrations
FOR INSERT
WITH CHECK (status = 'pending');

-- Trigger for updated_at
CREATE TRIGGER update_online_registrations_updated_at
BEFORE UPDATE ON public.online_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
