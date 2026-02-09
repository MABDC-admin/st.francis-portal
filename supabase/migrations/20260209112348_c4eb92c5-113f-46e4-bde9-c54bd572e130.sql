-- Allow finance role to view students in their assigned schools
CREATE POLICY "Finance can view students in their schools"
ON public.students
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'finance'::app_role)
  AND school_id IN (
    SELECT school_id FROM public.user_school_access
    WHERE user_id = auth.uid() AND is_active = true
  )
);