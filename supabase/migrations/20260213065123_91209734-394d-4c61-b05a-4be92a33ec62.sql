
-- Fix: Replace overly permissive INSERT policy on profiles
-- The trigger handle_new_user runs as SECURITY DEFINER so it bypasses RLS
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;

-- Add admin DELETE policy on profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
