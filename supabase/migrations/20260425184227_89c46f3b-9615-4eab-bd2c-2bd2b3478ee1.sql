-- Helper: list of grade levels a teacher (auth user) teaches in their school
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
  WHERE t.user_id = _user_id
     OR t.email = (SELECT email FROM auth.users WHERE id = _user_id)
     OR t.id IN (SELECT teacher_id FROM public.user_credentials WHERE user_id = _user_id AND teacher_id IS NOT NULL)
  UNION
  SELECT DISTINCT s.school_id, s.grade_level
  FROM public.sections s
  JOIN public.teachers t ON t.id = s.advisor_teacher_id
  WHERE t.user_id = _user_id
     OR t.email = (SELECT email FROM auth.users WHERE id = _user_id)
     OR t.id IN (SELECT teacher_id FROM public.user_credentials WHERE user_id = _user_id AND teacher_id IS NOT NULL);
$$;

-- Allow teachers to view students in grade levels they teach
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;
CREATE POLICY "Teachers can view students in their classes"
ON public.students FOR SELECT
USING (
  has_role(auth.uid(), 'teacher'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.teacher_grade_levels(auth.uid()) tgl
    WHERE tgl.school_id = students.school_id
      AND lower(regexp_replace(tgl.grade_level, '\s+', '', 'g')) = lower(regexp_replace(students.level, '\s+', '', 'g'))
  )
);

-- Allow teachers to view their own teacher record by email (in addition to user_id match)
DROP POLICY IF EXISTS "Teachers can view own record by email" ON public.teachers;
CREATE POLICY "Teachers can view own record by email"
ON public.teachers FOR SELECT
USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR id IN (SELECT teacher_id FROM public.user_credentials WHERE user_id = auth.uid() AND teacher_id IS NOT NULL)
);