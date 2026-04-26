-- Fix teacher self-access RLS so teacher portal can resolve its own teacher record
-- without relying on direct reads from auth.users inside a policy expression.

CREATE OR REPLACE FUNCTION public.teacher_matches_current_user(
  target_teacher_id uuid,
  target_user_id uuid,
  target_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    target_user_id = auth.uid()
    OR lower(coalesce(target_email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))
    OR EXISTS (
      SELECT 1
      FROM public.user_credentials uc
      WHERE uc.user_id = auth.uid()
        AND uc.teacher_id = target_teacher_id
    );
$$;

CREATE OR REPLACE FUNCTION public.teacher_grade_levels(_user_id uuid)
RETURNS TABLE(school_id uuid, grade_level text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cs.school_id, cs.grade_level
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email)
  UNION
  SELECT DISTINCT s.school_id, s.grade_level
  FROM public.sections s
  JOIN public.teachers t ON t.id = s.advisor_teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email);
$$;

DROP POLICY IF EXISTS "Teachers can view own record" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can view own record by email" ON public.teachers;

CREATE POLICY "Teachers can view own teacher record"
ON public.teachers
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::app_role)
  AND public.teacher_matches_current_user(id, user_id, email)
);
