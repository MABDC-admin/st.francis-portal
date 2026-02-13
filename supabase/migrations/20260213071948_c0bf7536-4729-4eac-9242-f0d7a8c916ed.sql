
-- RLS policy: IT role can view all profiles
CREATE POLICY "IT role full profile access"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'it'));

-- RLS policy: IT role can view all user_roles
CREATE POLICY "IT role can view all user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'it'));
