
DROP POLICY IF EXISTS "Only admins can view credentials" ON public.user_credentials;
CREATE POLICY "Admins and registrars can view credentials"
  ON public.user_credentials FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'registrar'::app_role)
    OR user_id = auth.uid()
  );
