-- Lock teacher attendance access to assigned classes only.
-- Replace the broad teacher-wide staff policy with role-specific policies.

CREATE OR REPLACE FUNCTION public.teacher_class_scope(_user_id uuid)
RETURNS TABLE(
  school_id uuid,
  academic_year_id uuid,
  grade_level text,
  section text
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
    cs.section
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email)

  UNION

  SELECT DISTINCT
    s.school_id,
    s.academic_year_id,
    s.grade_level,
    s.name AS section
  FROM public.sections s
  JOIN public.teachers t ON t.id = s.advisor_teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email);
$$;

DROP POLICY IF EXISTS "Staff manage attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Admins manage attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Registrars manage attendance" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers view attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers insert attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers update attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers delete attendance in assigned classes" ON public.student_attendance;

CREATE POLICY "Admins manage attendance"
ON public.student_attendance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Registrars manage attendance"
ON public.student_attendance
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'registrar'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'registrar'::public.app_role));

CREATE POLICY "Teachers view attendance in assigned classes"
ON public.student_attendance
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tcs.section IS NULL OR s.section IS NULL OR tcs.section = s.section)
  )
);

CREATE POLICY "Teachers insert attendance in assigned classes"
ON public.student_attendance
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tcs.section IS NULL OR s.section IS NULL OR tcs.section = s.section)
  )
);

CREATE POLICY "Teachers update attendance in assigned classes"
ON public.student_attendance
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tcs.section IS NULL OR s.section IS NULL OR tcs.section = s.section)
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tcs.section IS NULL OR s.section IS NULL OR tcs.section = s.section)
  )
);

CREATE POLICY "Teachers delete attendance in assigned classes"
ON public.student_attendance
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (tcs.section IS NULL OR s.section IS NULL OR tcs.section = s.section)
  )
);
