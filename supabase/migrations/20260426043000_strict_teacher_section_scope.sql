-- Align teacher visibility with section scope.
-- A blank class schedule section only means whole-grade access when the teacher
-- has no section-scoped assignment for that same school/year/grade.

DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

DROP FUNCTION IF EXISTS public.teacher_grade_levels(uuid);

CREATE FUNCTION public.teacher_grade_levels(_user_id uuid)
RETURNS TABLE(school_id uuid, academic_year_id uuid, grade_level text, section text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT cs.school_id, cs.academic_year_id, cs.grade_level, cs.section
  FROM public.class_schedules cs
  JOIN public.teachers t ON t.id = cs.teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email)

  UNION

  SELECT DISTINCT s.school_id, s.academic_year_id, s.grade_level, s.name AS section
  FROM public.sections s
  JOIN public.teachers t ON t.id = s.advisor_teacher_id
  WHERE public.teacher_matches_current_user(t.id, t.user_id, t.email);
$$;

CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_levels(auth.uid()) tgl
    WHERE tgl.school_id = students.school_id
      AND tgl.academic_year_id = students.academic_year_id
      AND lower(regexp_replace(tgl.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(students.level, '\s+', '', 'g'))
      AND (
        (
          tgl.section IS NOT NULL
          AND btrim(tgl.section) <> ''
          AND students.section IS NOT NULL
          AND btrim(students.section) <> ''
          AND lower(btrim(tgl.section)) = lower(btrim(students.section))
        )
        OR (
          (tgl.section IS NULL OR btrim(tgl.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_levels(auth.uid()) scoped
            WHERE scoped.school_id = students.school_id
              AND scoped.academic_year_id = students.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(students.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
  )
);

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
        (
          tgs.section IS NOT NULL
          AND btrim(tgs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tgs.section)) = lower(btrim(s.section))
        )
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
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
        (
          tgs.section IS NOT NULL
          AND btrim(tgs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tgs.section)) = lower(btrim(s.section))
        )
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
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
        (
          tgs.section IS NOT NULL
          AND btrim(tgs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tgs.section)) = lower(btrim(s.section))
        )
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
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
        (
          tgs.section IS NOT NULL
          AND btrim(tgs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tgs.section)) = lower(btrim(s.section))
        )
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
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
      AND (
        (
          tgs.section IS NOT NULL
          AND btrim(tgs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tgs.section)) = lower(btrim(s.section))
        )
        OR (
          (tgs.section IS NULL OR btrim(tgs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_grade_scope(auth.uid()) scoped
            WHERE scoped.subject_id = student_grades.subject_id
              AND scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
  )
);

DROP POLICY IF EXISTS "Teachers view attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers insert attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers update attendance in assigned classes" ON public.student_attendance;
DROP POLICY IF EXISTS "Teachers delete attendance in assigned classes" ON public.student_attendance;

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
      AND (
        (
          tcs.section IS NOT NULL
          AND btrim(tcs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tcs.section)) = lower(btrim(s.section))
        )
        OR (
          (tcs.section IS NULL OR btrim(tcs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_class_scope(auth.uid()) scoped
            WHERE scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (
          tcs.section IS NOT NULL
          AND btrim(tcs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tcs.section)) = lower(btrim(s.section))
        )
        OR (
          (tcs.section IS NULL OR btrim(tcs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_class_scope(auth.uid()) scoped
            WHERE scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (
          tcs.section IS NOT NULL
          AND btrim(tcs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tcs.section)) = lower(btrim(s.section))
        )
        OR (
          (tcs.section IS NULL OR btrim(tcs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_class_scope(auth.uid()) scoped
            WHERE scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
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
    JOIN public.teacher_class_scope(auth.uid()) tcs
      ON tcs.school_id = s.school_id
     AND tcs.academic_year_id = s.academic_year_id
    WHERE s.id = student_attendance.student_id
      AND student_attendance.academic_year_id = s.academic_year_id
      AND lower(regexp_replace(tcs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(s.level, '\s+', '', 'g'))
      AND (
        (
          tcs.section IS NOT NULL
          AND btrim(tcs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tcs.section)) = lower(btrim(s.section))
        )
        OR (
          (tcs.section IS NULL OR btrim(tcs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_class_scope(auth.uid()) scoped
            WHERE scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
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
      AND (
        (
          tcs.section IS NOT NULL
          AND btrim(tcs.section) <> ''
          AND s.section IS NOT NULL
          AND btrim(s.section) <> ''
          AND lower(btrim(tcs.section)) = lower(btrim(s.section))
        )
        OR (
          (tcs.section IS NULL OR btrim(tcs.section) = '')
          AND NOT EXISTS (
            SELECT 1
            FROM public.teacher_class_scope(auth.uid()) scoped
            WHERE scoped.school_id = s.school_id
              AND scoped.academic_year_id = s.academic_year_id
              AND lower(regexp_replace(scoped.grade_level, '\s+', '', 'g')) =
                  lower(regexp_replace(s.level, '\s+', '', 'g'))
              AND scoped.section IS NOT NULL
              AND btrim(scoped.section) <> ''
          )
        )
      )
  )
);
