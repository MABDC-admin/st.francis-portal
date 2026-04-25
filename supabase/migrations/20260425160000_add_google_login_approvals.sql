CREATE TABLE IF NOT EXISTS public.google_login_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  provider text NOT NULL DEFAULT 'google',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  assigned_role public.app_role,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_google_login_approvals_status
  ON public.google_login_approvals(status);

CREATE INDEX IF NOT EXISTS idx_google_login_approvals_created_at
  ON public.google_login_approvals(created_at DESC);

ALTER TABLE public.google_login_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own google login approval"
  ON public.google_login_approvals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own google login approval"
  ON public.google_login_approvals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin and IT can view google login approvals"
  ON public.google_login_approvals
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'it'::public.app_role)
  );

CREATE POLICY "Admin and IT can update google login approvals"
  ON public.google_login_approvals
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'it'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'it'::public.app_role)
  );

CREATE POLICY "Admin and IT can insert google login approvals"
  ON public.google_login_approvals
  FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'it'::public.app_role)
  );

CREATE POLICY "Service role can manage google login approvals"
  ON public.google_login_approvals
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_google_login_approvals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_google_login_approvals_updated_at
  ON public.google_login_approvals;

CREATE TRIGGER update_google_login_approvals_updated_at
  BEFORE UPDATE ON public.google_login_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_google_login_approvals_updated_at();
