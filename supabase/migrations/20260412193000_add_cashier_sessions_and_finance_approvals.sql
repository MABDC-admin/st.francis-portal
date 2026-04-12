-- Cashier Portal Phase 1: Sessions + Approval Queue

CREATE TABLE IF NOT EXISTS public.cashier_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  opened_by uuid NOT NULL DEFAULT auth.uid(),
  closed_by uuid,
  terminal_id text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  opening_cash numeric NOT NULL DEFAULT 0,
  expected_cash numeric NOT NULL DEFAULT 0,
  actual_cash numeric,
  variance_cash numeric GENERATED ALWAYS AS (
    COALESCE(actual_cash, 0) - COALESCE(expected_cash, 0)
  ) STORED,
  notes text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cashier_sessions_status_consistency CHECK (
    (status = 'open' AND closed_at IS NULL)
    OR (status IN ('closed', 'cancelled') AND closed_at IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cashier_sessions_one_open_per_user
  ON public.cashier_sessions (school_id, academic_year_id, opened_by)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_cashier_sessions_school_year
  ON public.cashier_sessions (school_id, academic_year_id, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_cashier_sessions_status
  ON public.cashier_sessions (status);

ALTER TABLE public.cashier_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance and admin manage cashier_sessions" ON public.cashier_sessions;
CREATE POLICY "Finance and admin manage cashier_sessions"
ON public.cashier_sessions
FOR ALL
USING (
  public.has_role(auth.uid(), 'finance'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'finance'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Principal and registrar can view cashier_sessions" ON public.cashier_sessions;
CREATE POLICY "Principal and registrar can view cashier_sessions"
ON public.cashier_sessions
FOR SELECT
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

CREATE TABLE IF NOT EXISTS public.finance_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  request_type text NOT NULL CHECK (
    request_type IN ('discount', 'void_payment', 'refund', 'billing_adjustment', 'other')
  ),
  reference_table text,
  reference_id uuid,
  amount numeric,
  reason text NOT NULL,
  details jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'cancelled')
  ),
  requested_by uuid NOT NULL DEFAULT auth.uid(),
  requested_at timestamptz NOT NULL DEFAULT now(),
  decided_by uuid,
  decided_at timestamptz,
  decision_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_approval_requests_decision_consistency CHECK (
    (status = 'pending' AND decided_at IS NULL)
    OR (status IN ('approved', 'rejected', 'cancelled') AND decided_at IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_finance_approval_requests_school_year
  ON public.finance_approval_requests (school_id, academic_year_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_finance_approval_requests_status
  ON public.finance_approval_requests (status, request_type);

CREATE INDEX IF NOT EXISTS idx_finance_approval_requests_student
  ON public.finance_approval_requests (student_id);

ALTER TABLE public.finance_approval_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Finance and admin manage finance_approval_requests" ON public.finance_approval_requests;
CREATE POLICY "Finance and admin manage finance_approval_requests"
ON public.finance_approval_requests
FOR ALL
USING (
  public.has_role(auth.uid(), 'finance'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'finance'::public.app_role)
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
);

DROP POLICY IF EXISTS "Principal and registrar can view finance_approval_requests" ON public.finance_approval_requests;
CREATE POLICY "Principal and registrar can view finance_approval_requests"
ON public.finance_approval_requests
FOR SELECT
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

DROP POLICY IF EXISTS "Principal and registrar can decide finance_approval_requests" ON public.finance_approval_requests;
CREATE POLICY "Principal and registrar can decide finance_approval_requests"
ON public.finance_approval_requests
FOR UPDATE
USING (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'principal'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

DROP TRIGGER IF EXISTS update_cashier_sessions_updated_at ON public.cashier_sessions;
CREATE TRIGGER update_cashier_sessions_updated_at
BEFORE UPDATE ON public.cashier_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_finance_approval_requests_updated_at ON public.finance_approval_requests;
CREATE TRIGGER update_finance_approval_requests_updated_at
BEFORE UPDATE ON public.finance_approval_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS enforce_year_lock_cashier_sessions ON public.cashier_sessions;
CREATE TRIGGER enforce_year_lock_cashier_sessions
  BEFORE INSERT OR UPDATE OR DELETE ON public.cashier_sessions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

DROP TRIGGER IF EXISTS enforce_year_lock_finance_approval_requests ON public.finance_approval_requests;
CREATE TRIGGER enforce_year_lock_finance_approval_requests
  BEFORE INSERT OR UPDATE OR DELETE ON public.finance_approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();
