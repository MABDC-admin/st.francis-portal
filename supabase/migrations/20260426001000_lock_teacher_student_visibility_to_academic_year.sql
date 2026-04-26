-- Ensure teacher visibility to students is locked to the same academic year.
-- This prevents teachers from seeing learners from previous years just because
-- the grade level still matches.

CREATE OR REPLACE FUNCTION public.teacher_grade_levels(_user_id uuid)
RETURNS TABLE(school_id uuid, academic_year_id uuid, grade_level text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cs.school_id, cs.academic_year_id, cs.grade_level
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email)
  UNION
  SELECT DISTINCT s.school_id, s.academic_year_id, s.grade_level
  FROM public.sections s
  JOIN public.teachers t ON t.id = s.advisor_teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email);
$$;

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_levels(auth.uid()) tgl
    WHERE tgl.school_id = students.school_id
      AND tgl.academic_year_id = students.academic_year_id
      AND lower(regexp_replace(tgl.grade_level, '\s+', '', 'g')) = lower(regexp_replace(students.level, '\s+', '', 'g'))
  )
);
