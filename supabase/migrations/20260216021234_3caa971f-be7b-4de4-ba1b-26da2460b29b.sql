
-- Create teacher_applications table
CREATE TABLE public.teacher_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE,
  school_id UUID REFERENCES public.schools(id),
  status TEXT NOT NULL DEFAULT 'submitted',
  -- Personal Info
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  suffix TEXT,
  gender TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth TEXT,
  civil_status TEXT NOT NULL,
  nationality TEXT NOT NULL,
  photo_url TEXT,
  -- Contact
  mobile_number TEXT NOT NULL,
  alternate_mobile TEXT,
  email TEXT NOT NULL,
  house_street TEXT NOT NULL,
  barangay TEXT NOT NULL,
  city_municipality TEXT NOT NULL,
  province TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Philippines',
  -- Position
  position_applied TEXT NOT NULL,
  subject_specialization TEXT[],
  preferred_level TEXT,
  -- PRC License
  has_prc_license BOOLEAN DEFAULT false,
  prc_license_number TEXT,
  prc_expiration_date DATE,
  prc_license_url TEXT,
  -- Education (JSONB array)
  education JSONB DEFAULT '[]'::jsonb,
  -- Experience
  has_experience BOOLEAN DEFAULT false,
  experience JSONB DEFAULT '[]'::jsonb,
  -- Documents
  resume_url TEXT,
  transcript_url TEXT,
  diploma_url TEXT,
  valid_id_url TEXT,
  certificates_url TEXT[],
  -- Additional
  why_join TEXT,
  teaching_philosophy TEXT,
  expected_salary TEXT,
  available_start_date DATE,
  -- Admin fields
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create teacher_application_positions table
CREATE TABLE public.teacher_application_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.schools(id) NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_application_positions ENABLE ROW LEVEL SECURITY;

-- RLS: Anonymous INSERT for public form submission
CREATE POLICY "Allow anonymous insert on teacher_applications"
  ON public.teacher_applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS: Authenticated admin/registrar SELECT
CREATE POLICY "Admin and registrar can view teacher_applications"
  ON public.teacher_applications
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_school_access
      WHERE user_id = auth.uid()
        AND school_id = teacher_applications.school_id
        AND role IN ('admin', 'registrar')
        AND is_active = true
    )
  );

-- RLS: Authenticated admin/registrar UPDATE
CREATE POLICY "Admin and registrar can update teacher_applications"
  ON public.teacher_applications
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_school_access
      WHERE user_id = auth.uid()
        AND school_id = teacher_applications.school_id
        AND role IN ('admin', 'registrar')
        AND is_active = true
    )
  );

-- RLS: Positions - admin/registrar can manage
CREATE POLICY "Admin and registrar can view positions"
  ON public.teacher_application_positions
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_school_access
      WHERE user_id = auth.uid()
        AND school_id = teacher_application_positions.school_id
        AND role IN ('admin', 'registrar')
        AND is_active = true
    )
  );

-- RLS: Anon can read active positions (for the public form dropdown)
CREATE POLICY "Anyone can view active positions"
  ON public.teacher_application_positions
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY "Admin and registrar can insert positions"
  ON public.teacher_application_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_school_access
      WHERE user_id = auth.uid()
        AND school_id = teacher_application_positions.school_id
        AND role IN ('admin', 'registrar')
        AND is_active = true
    )
  );

CREATE POLICY "Admin and registrar can update positions"
  ON public.teacher_application_positions
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.user_school_access
      WHERE user_id = auth.uid()
        AND school_id = teacher_application_positions.school_id
        AND role IN ('admin', 'registrar')
        AND is_active = true
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_teacher_applications_updated_at
  BEFORE UPDATE ON public.teacher_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Reference number generation function
CREATE OR REPLACE FUNCTION public.generate_teacher_application_ref()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := to_char(now(), 'YYYY');
  SELECT COALESCE(MAX(
    CAST(NULLIF(substring(reference_number from 'TCH-\d{4}-(\d+)'), '') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.teacher_applications
  WHERE reference_number LIKE 'TCH-' || year_str || '-%';

  NEW.reference_number := 'TCH-' || year_str || '-' || lpad(next_num::text, 6, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_teacher_app_ref_trigger
  BEFORE INSERT ON public.teacher_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_teacher_application_ref();

-- Storage bucket for teacher application documents
INSERT INTO storage.buckets (id, name, public)
  VALUES ('teacher-applications', 'teacher-applications', false);

-- Storage: Allow anonymous uploads
CREATE POLICY "Allow anonymous upload to teacher-applications"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'teacher-applications');

-- Storage: Authenticated admin/registrar can read
CREATE POLICY "Admin registrar can read teacher-applications"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'teacher-applications' AND (
      public.has_role(auth.uid(), 'admin') OR
      EXISTS (
        SELECT 1 FROM public.user_school_access
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'registrar')
          AND is_active = true
      )
    )
  );
