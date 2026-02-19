
-- Create admissions table
CREATE TABLE public.admissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name text NOT NULL,
  lrn text,
  level text NOT NULL,
  school text,
  school_id uuid NOT NULL REFERENCES public.schools(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  birth_date date,
  gender text,
  mother_maiden_name text,
  mother_contact text,
  father_name text,
  father_contact text,
  phil_address text,
  uae_address text,
  previous_school text,
  parent_email text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for admissions (admin and registrar only)
CREATE POLICY "Admin can view all admissions"
  ON public.admissions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrar can view all admissions"
  ON public.admissions FOR SELECT
  USING (public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Admin can insert admissions"
  ON public.admissions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrar can insert admissions"
  ON public.admissions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Admin can update admissions"
  ON public.admissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrar can update admissions"
  ON public.admissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'registrar'));

-- Create admission_audit_logs table
CREATE TABLE public.admission_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admission_id uuid NOT NULL REFERENCES public.admissions(id),
  action text NOT NULL,
  performed_by uuid,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admission_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view admission audit logs"
  ON public.admission_audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrar can view admission audit logs"
  ON public.admission_audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Admin can insert admission audit logs"
  ON public.admission_audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrar can insert admission audit logs"
  ON public.admission_audit_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'registrar'));

-- Trigger for updated_at on admissions
CREATE TRIGGER update_admissions_updated_at
  BEFORE UPDATE ON public.admissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
