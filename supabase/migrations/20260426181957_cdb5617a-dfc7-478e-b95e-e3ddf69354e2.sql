-- Helper: subject + grade + section scope for a teacher
DROP FUNCTION IF EXISTS public.teacher_grade_scope(uuid);

CREATE FUNCTION public.teacher_grade_scope(_user_id uuid)
RETURNS TABLE(school_id uuid, academic_year_id uuid, subject_id uuid, grade_level text, section text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cs.school_id, cs.academic_year_id, cs.subject_id, cs.grade_level, cs.section
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email);
$$;

DROP POLICY IF EXISTS "Teachers can view grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can insert grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can update grades in assigned classes" ON public.student_grades;
DROP POLICY IF EXISTS "Teachers can delete draft grades in assigned classes" ON public.student_grades;

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
      AND (
        (tgs.section IS NOT NULL AND btrim(tgs.section) <> ''
         AND s.section IS NOT NULL AND btrim(s.section) <> ''
         AND lower(btrim(tgs.section)) = lower(btrim(s.section)))
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1 FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (tgs.section IS NOT NULL AND btrim(tgs.section) <> ''
         AND s.section IS NOT NULL AND btrim(s.section) <> ''
         AND lower(btrim(tgs.section)) = lower(btrim(s.section)))
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1 FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (tgs.section IS NOT NULL AND btrim(tgs.section) <> ''
         AND s.section IS NOT NULL AND btrim(s.section) <> ''
         AND lower(btrim(tgs.section)) = lower(btrim(s.section)))
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1 FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (tgs.section IS NOT NULL AND btrim(tgs.section) <> ''
         AND s.section IS NOT NULL AND btrim(s.section) <> ''
         AND lower(btrim(tgs.section)) = lower(btrim(s.section)))
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1 FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL AND btrim(scoped.section) <> ''
          )
        )
      )
  )
);

CREATE POLICY "Teachers can delete draft grades in assigned classes"
ON public.student_grades
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND coalesce(student_grades.status, 'draft') = 'draft'
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
      AND (
        (tgs.section IS NOT NULL AND btrim(tgs.section) <> ''
         AND s.section IS NOT NULL AND btrim(s.section) <> ''
         AND lower(btrim(tgs.section)) = lower(btrim(s.section)))
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1 FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL AND btrim(scoped.section) <> ''
          )
        )
      )
  )
);
