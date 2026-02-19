-- Allow admins to update credentials (for password resets)
CREATE POLICY "Admins can update credentials"
ON public.user_credentials
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));