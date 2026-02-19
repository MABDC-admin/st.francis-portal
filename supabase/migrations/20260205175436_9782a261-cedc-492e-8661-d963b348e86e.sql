-- Create auth activity logs table for tracking login/logout events
CREATE TABLE public.auth_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL, -- 'login', 'logout', 'failed_login'
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy for viewing logs
CREATE POLICY "Admins can view all auth logs"
  ON public.auth_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admin-only insert policy (for logging from edge functions)
CREATE POLICY "Service role can insert auth logs"
  ON public.auth_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create role change audit logging table
CREATE TABLE public.role_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  old_role TEXT,
  new_role TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access for role change logs
CREATE POLICY "Admins can view role change logs"
  ON public.role_change_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert role change logs"
  ON public.role_change_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better query performance
CREATE INDEX idx_auth_activity_logs_user_id ON public.auth_activity_logs(user_id);
CREATE INDEX idx_auth_activity_logs_created_at ON public.auth_activity_logs(created_at DESC);
CREATE INDEX idx_auth_activity_logs_action ON public.auth_activity_logs(action);
CREATE INDEX idx_role_change_logs_user_id ON public.role_change_logs(user_id);
CREATE INDEX idx_role_change_logs_created_at ON public.role_change_logs(created_at DESC);