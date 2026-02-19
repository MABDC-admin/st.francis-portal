-- Migration: Create schools table and add school-academic year segregation
-- Part 1: Create the schools infrastructure

-- ============================================================================
-- PART 1: Create schools table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  contact_number TEXT,
  email TEXT,
  principal_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Anyone can view active schools
CREATE POLICY "Anyone can view active schools" ON public.schools
FOR SELECT USING (is_active = true);

-- Admins can manage schools
CREATE POLICY "Admins can manage schools" ON public.schools
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_schools_updated_at
BEFORE UPDATE ON public.schools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- PART 2: Add school_id to academic_years table
-- ============================================================================

ALTER TABLE public.academic_years 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_academic_years_school 
ON public.academic_years(school_id);

-- ============================================================================
-- PART 3: Insert default schools (STFXS and STFXSA)
-- ============================================================================

INSERT INTO public.schools (id, name, code, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111'::uuid, 'St. Francis Xavier School', 'STFXS', true),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'St. Francis Xavier Smart Academy', 'STFXSA', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 4: Update existing academic_years with default school
-- ============================================================================

-- Assign existing academic years to first school (STFXS) if not already assigned
UPDATE public.academic_years
SET school_id = '11111111-1111-1111-1111-111111111111'::uuid
WHERE school_id IS NULL;

-- Make school_id NOT NULL after populating
ALTER TABLE public.academic_years 
ALTER COLUMN school_id SET NOT NULL;

-- ============================================================================
-- PART 5: Add school_id and academic_year_id to data tables
-- ============================================================================

-- Students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id);

-- Grades/student_grades table (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_grades') THEN
    ALTER TABLE public.student_grades 
    ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
    ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id);
  END IF;
END $$;

-- Raw scores table
ALTER TABLE public.raw_scores 
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id),
ADD COLUMN IF NOT EXISTS academic_year_id UUID REFERENCES public.academic_years(id);

-- Student subjects table
ALTER TABLE public.student_subjects
ADD COLUMN IF NOT EXISTS school_id UUID REFERENCES public.schools(id);

-- ============================================================================
-- PART 6: Populate existing records with default school and academic year
-- ============================================================================

DO $$ 
DECLARE
  default_school_id UUID := '11111111-1111-1111-1111-111111111111'::uuid;
  default_academic_year_id UUID;
BEGIN
  -- Get first academic year for default school
  SELECT id INTO default_academic_year_id 
  FROM public.academic_years 
  WHERE school_id = default_school_id 
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no academic year exists, create one
  IF default_academic_year_id IS NULL THEN
    INSERT INTO public.academic_years (school_id, name, start_date, end_date, is_current)
    VALUES (
      default_school_id,
      '2024-2025',
      '2024-08-01',
      '2025-07-31',
      true
    )
    RETURNING id INTO default_academic_year_id;
  END IF;
  
  -- Update students
  UPDATE public.students 
  SET school_id = default_school_id,
      academic_year_id = default_academic_year_id
  WHERE school_id IS NULL OR academic_year_id IS NULL;
  
  -- Update student_grades (if exists)
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_grades') THEN
    EXECUTE format('
      UPDATE public.student_grades 
      SET school_id = %L,
          academic_year_id = %L
      WHERE school_id IS NULL OR academic_year_id IS NULL
    ', default_school_id, default_academic_year_id);
  END IF;
  
  -- Update raw_scores
  UPDATE public.raw_scores 
  SET school_id = default_school_id,
      academic_year_id = default_academic_year_id
  WHERE school_id IS NULL OR academic_year_id IS NULL;
  
  -- Update student_subjects
  UPDATE public.student_subjects
  SET school_id = default_school_id
  WHERE school_id IS NULL;
END $$;

-- ============================================================================
-- PART 7: Make columns NOT NULL
-- ============================================================================

ALTER TABLE public.students 
ALTER COLUMN school_id SET NOT NULL,
ALTER COLUMN academic_year_id SET NOT NULL;

ALTER TABLE public.raw_scores 
ALTER COLUMN school_id SET NOT NULL,
ALTER COLUMN academic_year_id SET NOT NULL;

ALTER TABLE public.student_subjects
ALTER COLUMN school_id SET NOT NULL;

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_grades') THEN
    ALTER TABLE public.student_grades 
    ALTER COLUMN school_id SET NOT NULL,
    ALTER COLUMN academic_year_id SET NOT NULL;
  END IF;
END $$;

-- ============================================================================
-- PART 8: Create composite indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_students_school_year 
ON public.students(school_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_raw_scores_school_year 
ON public.raw_scores(school_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_student_subjects_school 
ON public.student_subjects(school_id);

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_grades') THEN
    CREATE INDEX IF NOT EXISTS idx_student_grades_school_year 
    ON public.student_grades(school_id, academic_year_id);
  END IF;
END $$;

-- ============================================================================
-- PART 9: Create validation function and triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_school_academic_year()
RETURNS TRIGGER AS $$
DECLARE
  ay_school_id UUID;
BEGIN
  -- Get the school_id from the academic_year
  SELECT school_id INTO ay_school_id
  FROM public.academic_years
  WHERE id = NEW.academic_year_id;

  -- Check if academic year exists
  IF ay_school_id IS NULL THEN
    RAISE EXCEPTION 'Academic year % does not exist', NEW.academic_year_id;
  END IF;

  -- Check if school_id matches
  IF ay_school_id != NEW.school_id THEN
    RAISE EXCEPTION 'Data segregation violation: Academic year % belongs to school %, but record specifies school %',
      NEW.academic_year_id, ay_school_id, NEW.school_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_validate_students_school_year ON public.students;
CREATE TRIGGER trg_validate_students_school_year
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION validate_school_academic_year();

DROP TRIGGER IF EXISTS trg_validate_raw_scores_school_year ON public.raw_scores;
CREATE TRIGGER trg_validate_raw_scores_school_year
  BEFORE INSERT OR UPDATE ON public.raw_scores
  FOR EACH ROW
  EXECUTE FUNCTION validate_school_academic_year();

DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_grades') THEN
    DROP TRIGGER IF EXISTS trg_validate_student_grades_school_year ON public.student_grades;
    CREATE TRIGGER trg_validate_student_grades_school_year
      BEFORE INSERT OR UPDATE ON public.student_grades
      FOR EACH ROW
      EXECUTE FUNCTION validate_school_academic_year();
  END IF;
END $$;

-- ============================================================================
-- PART 10: Add comments for documentation
-- ============================================================================

COMMENT ON TABLE public.schools IS 'Schools in the system (STFXS and STFXSA)';
COMMENT ON COLUMN public.academic_years.school_id IS 'School this academic year belongs to';
COMMENT ON COLUMN public.students.school_id IS 'School this student belongs to - ensures data segregation';
COMMENT ON COLUMN public.students.academic_year_id IS 'Academic year for this student record - ensures data segregation';
COMMENT ON FUNCTION validate_school_academic_year() IS 'Validates that academic_year_id belongs to the same school as the record';
