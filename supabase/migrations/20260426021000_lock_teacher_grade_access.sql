-- Lock teacher grade access to their assigned class schedules only.
-- Also add explicit principal read-only access for the Grades module.

CREATE OR REPLACE FUNCTION public.teacher_grade_scope(_user_id uuid)
RETURNS TABLE(
  school_id uuid,
  academic_year_id uuid,
  grade_level text,
  section text,
  subject_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT
    cs.school_id,
    cs.academic_year_id,
    cs.grade_level,
    cs.section,
    cs.subject_id
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email)
    AND cs.subject_id IS NOT NULL;
$$;

DROP POLICY IF EXISTS "Teachers can view and update grades" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can view grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can insert grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can update grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can delete draft grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Principals can view grades in their schools" ON public.student_grades;

CREATE POLICY "Teachers can view grades in assigned classes"
ON public.student_grades
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.subject_id = student_grades.subject_id
     AND tgs.school_id = s.school_id
     AND tgs.academic_year_id = s.academic_year_id
    WHERE s.id = student_grades.student_id
      AND student_grades.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tgs.section IS NULL OR s.section IS NULL OR tgs.section = s.section)
  )
);

CREATE POLICY "Teachers can insert grades in assigned classes"
ON public.student_grades
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.subject_id = student_grades.subject_id
     AND tgs.school_id = s.school_id
     AND tgs.academic_year_id = s.academic_year_id
    WHERE s.id = student_grades.student_id
      AND student_grades.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tgs.section IS NULL OR s.section IS NULL OR tgs.section = s.section)
  )
);

CREATE POLICY "Teachers can update grades in assigned classes"
ON public.student_grades
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.subject_id = student_grades.subject_id
     AND tgs.school_id = s.school_id
     AND tgs.academic_year_id = s.academic_year_id
    WHERE s.id = student_grades.student_id
      AND student_grades.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tgs.section IS NULL OR s.section IS NULL OR tgs.section = s.section)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.subject_id = student_grades.subject_id
     AND tgs.school_id = s.school_id
     AND tgs.academic_year_id = s.academic_year_id
    WHERE s.id = student_grades.student_id
      AND student_grades.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tgs.section IS NULL OR s.section IS NULL OR tgs.section = s.section)
  )
);

CREATE POLICY "Teachers can delete draft grades in assigned classes"
ON public.student_grades
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND coalesce(student_grades.status, 'draft') <> 'finalized'
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.subject_id = student_grades.subject_id
     AND tgs.school_id = s.school_id
     AND tgs.academic_year_id = s.academic_year_id
    WHERE s.id = student_grades.student_id
      AND student_grades.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tgs.section IS NULL OR s.section IS NULL OR tgs.section = s.section)
  )
);

CREATE POLICY "Principals can view grades in their schools"
ON public.student_grades
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  AND coalesce(
    student_grades.school_id,
    (
      SELECT s.school_id
      FROM public.students s
      WHERE s.id = student_grades.student_id
    )
  ) IN (
    SELECT usa.school_id
    FROM public.user_school_access usa
    WHERE usa.user_id = auth.uid()
      AND usa.is_active = true
  )
);
