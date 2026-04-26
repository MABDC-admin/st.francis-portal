-- Lesson plan security: teachers can create/update/delete only plans tied to
-- their assigned class schedule, school, academic year, grade, and subject.

DROP POLICY IF EXISTS "Teachers can view own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can insert own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can update own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can delete own lesson plans" ON public.teacher_lesson_plans;

CREATE POLICY "Teachers can view own lesson plans"
ON public.teacher_lesson_plans
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
);

CREATE POLICY "Teachers can insert own lesson plans"
ON public.teacher_lesson_plans
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.class_schedules cs
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.school_id = cs.school_id
     AND tgs.academic_year_id = cs.academic_year_id
     AND tgs.subject_id = cs.subject_id
    WHERE cs.id = teacher_lesson_plans.class_schedule_id
      AND cs.teacher_id = teacher_lesson_plans.teacher_id
      AND cs.school_id = teacher_lesson_plans.school_id
      AND cs.academic_year_id = teacher_lesson_plans.academic_year_id
      AND cs.subject_id = teacher_lesson_plans.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(cs.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Teachers can update own lesson plans"
ON public.teacher_lesson_plans
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
  AND EXISTS (
    SELECT 1
    FROM public.class_schedules cs
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.school_id = cs.school_id
     AND tgs.academic_year_id = cs.academic_year_id
     AND tgs.subject_id = cs.subject_id
    WHERE cs.id = teacher_lesson_plans.class_schedule_id
      AND cs.teacher_id = teacher_lesson_plans.teacher_id
      AND cs.school_id = teacher_lesson_plans.school_id
      AND cs.academic_year_id = teacher_lesson_plans.academic_year_id
      AND cs.subject_id = teacher_lesson_plans.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(cs.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Teachers can delete own lesson plans"
ON public.teacher_lesson_plans
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
  AND status IN ('draft', 'rejected')
);
