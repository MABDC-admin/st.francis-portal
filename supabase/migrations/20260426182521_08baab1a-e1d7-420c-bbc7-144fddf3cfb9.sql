DROP POLICY IF EXISTS "Students view grade-level assignments" ON public.student_assignments;
DROP POLICY IF EXISTS "Staff manage assignments" ON public.student_assignments;
DROP POLICY IF EXISTS "Admins and registrars manage assignments" ON public.student_assignments;
DROP POLICY IF EXISTS "Teachers view assignments in assigned classes" ON public.student_assignments;
DROP POLICY IF EXISTS "Teachers insert assignments in assigned classes" ON public.student_assignments;
DROP POLICY IF EXISTS "Teachers update assignments in assigned classes" ON public.student_assignments;
DROP POLICY IF EXISTS "Teachers delete assignments in assigned classes" ON public.student_assignments;
DROP POLICY IF EXISTS "Students view assignments for their academic year and grade" ON public.student_assignments;

CREATE POLICY "Admins and registrars manage assignments"
ON public.student_assignments
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

CREATE POLICY "Teachers view assignments in assigned classes"
ON public.student_assignments
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_scope(auth.uid()) tgs
    WHERE tgs.school_id = student_assignments.school_id
      AND tgs.academic_year_id = student_assignments.academic_year_id
      AND tgs.subject_id = student_assignments.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Teachers insert assignments in assigned classes"
ON public.student_assignments
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_scope(auth.uid()) tgs
    WHERE tgs.school_id = student_assignments.school_id
      AND tgs.academic_year_id = student_assignments.academic_year_id
      AND tgs.subject_id = student_assignments.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Teachers update assignments in assigned classes"
ON public.student_assignments
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_scope(auth.uid()) tgs
    WHERE tgs.school_id = student_assignments.school_id
      AND tgs.academic_year_id = student_assignments.academic_year_id
      AND tgs.subject_id = student_assignments.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_scope(auth.uid()) tgs
    WHERE tgs.school_id = student_assignments.school_id
      AND tgs.academic_year_id = student_assignments.academic_year_id
      AND tgs.subject_id = student_assignments.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Teachers delete assignments in assigned classes"
ON public.student_assignments
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.teacher_grade_scope(auth.uid()) tgs
    WHERE tgs.school_id = student_assignments.school_id
      AND tgs.academic_year_id = student_assignments.academic_year_id
      AND tgs.subject_id = student_assignments.subject_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
);

CREATE POLICY "Students view assignments for their academic year and grade"
ON public.student_assignments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_credentials uc
    JOIN public.students s ON s.id = uc.student_id
    WHERE uc.user_id = auth.uid()
      AND s.school_id = student_assignments.school_id
      AND s.academic_year_id = student_assignments.academic_year_id
      AND lower(regexp_replace(s.level, '\s+', '', 'g')) =
          lower(regexp_replace(student_assignments.grade_level, '\s+', '', 'g'))
  )
);

DROP POLICY IF EXISTS "Staff manage submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Admins and registrars manage assignment submissions" ON public.assignment_submissions;
DROP POLICY IF EXISTS "Teachers manage submissions in assigned classes" ON public.assignment_submissions;

CREATE POLICY "Admins and registrars manage assignment submissions"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

CREATE POLICY "Teachers manage submissions in assigned classes"
ON public.assignment_submissions
FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.student_assignments a
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.school_id = a.school_id
     AND tgs.academic_year_id = a.academic_year_id
     AND tgs.subject_id = a.subject_id
    WHERE a.id = assignment_submissions.assignment_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(a.grade_level, '\s+', '', 'g'))
  )
)
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND EXISTS (
    SELECT 1
    FROM public.student_assignments a
    JOIN public.teacher_grade_scope(auth.uid()) tgs
      ON tgs.school_id = a.school_id
     AND tgs.academic_year_id = a.academic_year_id
     AND tgs.subject_id = a.subject_id
    WHERE a.id = assignment_submissions.assignment_id
      AND lower(regexp_replace(tgs.grade_level, '\s+', '', 'g')) =
          lower(regexp_replace(a.grade_level, '\s+', '', 'g'))
  )
);

INSERT INTO storage.buckets (id, name, public)
VALUES ('task-attachments', 'task-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read access to task-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload task-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete task-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Task attachments are readable" ON storage.objects;
DROP POLICY IF EXISTS "Portal users upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Portal users update own task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Portal users delete own task attachments" ON storage.objects;

CREATE POLICY "Task attachments are readable"
ON storage.objects
FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Portal users upload task attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'task-attachments'
  AND (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'registrar'::public.app_role)
    OR public.has_role(auth.uid(), 'teacher'::public.app_role)
    OR public.has_role(auth.uid(), 'student'::public.app_role)
  )
);

CREATE POLICY "Portal users update own task attachments"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  )
)
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Portal users delete own task attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'task-attachments'
  AND (
    owner = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  )
);