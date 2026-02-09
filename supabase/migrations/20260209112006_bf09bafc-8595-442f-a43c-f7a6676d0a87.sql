CREATE POLICY "Finance can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'finance'::app_role));