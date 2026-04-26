-- Restrict the generic students SELECT policy so teachers do not inherit
-- school-wide learner visibility through user_school_access.
-- Teacher visibility should flow through the dedicated teacher policy only.

DROP POLICY IF EXISTS "Users can view students from their schools" ON public.students;

CREATE POLICY "Users can view students from their schools"
ON public.students
FOR SELECT
TO authenticated
USING (
  -- Admin retains full global visibility
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR
  -- Registrar retains broad visibility across learner records
  public.has_role(auth.uid(), 'registrar'::public.app_role)
  OR
  -- Principals can view learners within their assigned schools
  (
    public.has_role(auth.uid(), 'principal'::public.app_role)
    AND school_id IN (
      SELECT usa.school_id
      FROM public.user_school_access usa
      WHERE usa.user_id = auth.uid()
        AND usa.is_active = true
    )
  )
  OR
  -- Students can still view their own learner record
  EXISTS (
    SELECT 1
    FROM public.user_credentials uc
    WHERE uc.user_id = auth.uid()
      AND uc.student_id = students.id
  )
);
