
-- Fix 1: profiles "Users can view own profile" should be {authenticated} not {public}
DROP POLICY "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Fix 2: profiles "Admins can view all profiles" should be {authenticated} not {public}
DROP POLICY "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 3: Add principal role SELECT access to profiles
CREATE POLICY "Principal can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'principal'));

-- Fix 4: user_credentials policies should use {authenticated} not {public}
DROP POLICY "Only admins can view credentials" ON public.user_credentials;
CREATE POLICY "Only admins can view credentials" ON public.user_credentials
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "Admins can update credentials" ON public.user_credentials;
CREATE POLICY "Admins can update credentials" ON public.user_credentials
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "Only admins can delete credentials" ON public.user_credentials;
CREATE POLICY "Only admins can delete credentials" ON public.user_credentials
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY "Service role can insert credentials" ON public.user_credentials;
CREATE POLICY "Service role can insert credentials" ON public.user_credentials
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY "Users can view their own credentials" ON public.user_credentials;
CREATE POLICY "Users can view their own credentials" ON public.user_credentials
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Fix 5: IT role can insert role_change_logs (for role management UI)
DROP POLICY "Admins can insert role change logs" ON public.role_change_logs;
CREATE POLICY "Admin and IT can insert role change logs" ON public.role_change_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

DROP POLICY "Admins can view role change logs" ON public.role_change_logs;
CREATE POLICY "Admin and IT can view role change logs" ON public.role_change_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

-- Fix 6: IT role can manage user_roles (upsert/update for role assignment)
DROP POLICY "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admin and IT can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

DROP POLICY "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admin and IT can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

-- Fix 7: Create profile_audit_logs table for tracking profile changes
CREATE TABLE IF NOT EXISTS public.profile_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  changed_by uuid NOT NULL,
  action text NOT NULL DEFAULT 'update',
  changed_fields jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs" ON public.profile_audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin and IT can view all audit logs" ON public.profile_audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'it'));

CREATE POLICY "Authenticated users can insert audit logs" ON public.profile_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());
