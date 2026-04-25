-- Sections master table for school/year-managed section registry
CREATE TABLE IF NOT EXISTS public.sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  grade_level text NOT NULL,
  name text NOT NULL,
  advisor_teacher_id uuid NULL REFERENCES public.teachers(id) ON DELETE SET NULL,
  capacity integer NULL CHECK (capacity IS NULL OR capacity > 0),
  is_active boolean NOT NULL DEFAULT true,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sections_name_not_blank CHECK (char_length(trim(name)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sections_unique_name_per_level
  ON public.sections (school_id, academic_year_id, grade_level, lower(name));

CREATE INDEX IF NOT EXISTS idx_sections_school_year
  ON public.sections (school_id, academic_year_id);

CREATE INDEX IF NOT EXISTS idx_sections_grade_level
  ON public.sections (grade_level);

CREATE INDEX IF NOT EXISTS idx_sections_advisor_teacher
  ON public.sections (advisor_teacher_id);

ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view sections" ON public.sections;
CREATE POLICY "Anyone can view sections"
  ON public.sections
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Staff manage sections" ON public.sections;
CREATE POLICY "Staff manage sections"
  ON public.sections
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'registrar')
  );

DROP TRIGGER IF EXISTS update_sections_updated_at ON public.sections;
CREATE TRIGGER update_sections_updated_at
  BEFORE UPDATE ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from existing class schedules
INSERT INTO public.sections (school_id, academic_year_id, grade_level, name, is_active)
SELECT
  cs.school_id,
  cs.academic_year_id,
  cs.grade_level,
  trim(cs.section),
  true
FROM public.class_schedules cs
WHERE cs.section IS NOT NULL AND btrim(cs.section) <> ''
GROUP BY cs.school_id, cs.academic_year_id, cs.grade_level, trim(cs.section)
ON CONFLICT DO NOTHING;

-- Backfill from existing learner records
INSERT INTO public.sections (school_id, academic_year_id, grade_level, name, is_active)
SELECT
  s.school_id,
  s.academic_year_id,
  s.level,
  trim(s.section),
  true
FROM public.students s
WHERE s.section IS NOT NULL AND btrim(s.section) <> ''
GROUP BY s.school_id, s.academic_year_id, s.level, trim(s.section)
ON CONFLICT DO NOTHING;
