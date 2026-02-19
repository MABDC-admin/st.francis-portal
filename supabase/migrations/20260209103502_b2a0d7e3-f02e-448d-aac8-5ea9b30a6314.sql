
-- 2. Fee Catalog
CREATE TABLE public.fee_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  amount NUMERIC NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_catalog_school ON public.fee_catalog(school_id);
ALTER TABLE public.fee_catalog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on fee_catalog" ON public.fee_catalog FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view fee_catalog" ON public.fee_catalog FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));

-- 3. Fee Templates
CREATE TABLE public.fee_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  name TEXT NOT NULL,
  grade_level TEXT,
  strand TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fee_templates_school ON public.fee_templates(school_id);
ALTER TABLE public.fee_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on fee_templates" ON public.fee_templates FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view fee_templates" ON public.fee_templates FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));

-- 4. Fee Template Items
CREATE TABLE public.fee_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.fee_templates(id) ON DELETE CASCADE,
  fee_catalog_id UUID NOT NULL REFERENCES public.fee_catalog(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.fee_template_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on fee_template_items" ON public.fee_template_items FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view fee_template_items" ON public.fee_template_items FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));

-- 5. Student Assessments
CREATE TABLE public.student_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  template_id UUID REFERENCES public.fee_templates(id),
  total_amount NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL DEFAULT 0,
  total_paid NUMERIC NOT NULL DEFAULT 0,
  balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  assessed_by UUID,
  assessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_student_assessments_student ON public.student_assessments(student_id);
CREATE INDEX idx_student_assessments_school ON public.student_assessments(school_id);
CREATE INDEX idx_student_assessments_ay ON public.student_assessments(academic_year_id);
ALTER TABLE public.student_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on student_assessments" ON public.student_assessments FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view student_assessments" ON public.student_assessments FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Students can view own assessments" ON public.student_assessments FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- 6. Assessment Items
CREATE TABLE public.assessment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.student_assessments(id) ON DELETE CASCADE,
  fee_catalog_id UUID REFERENCES public.fee_catalog(id),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  is_mandatory BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on assessment_items" ON public.assessment_items FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view assessment_items" ON public.assessment_items FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Students can view own assessment_items" ON public.assessment_items FOR SELECT
  USING (assessment_id IN (SELECT sa.id FROM student_assessments sa JOIN user_credentials uc ON uc.student_id = sa.student_id WHERE uc.user_id = auth.uid()));

-- 7. Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.student_assessments(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  or_number TEXT,
  receipt_type TEXT NOT NULL DEFAULT 'OR',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  void_reason TEXT,
  voided_by UUID,
  voided_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_student ON public.payments(student_id);
CREATE INDEX idx_payments_school ON public.payments(school_id);
CREATE INDEX idx_payments_ay ON public.payments(academic_year_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on payments" ON public.payments FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own payments" ON public.payments FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- 8. Payment Proofs
CREATE TABLE public.payment_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on payment_proofs" ON public.payment_proofs FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 9. Payment Plans
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.student_assessments(id),
  student_id UUID NOT NULL REFERENCES public.students(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  plan_type TEXT NOT NULL DEFAULT 'monthly',
  total_installments INTEGER NOT NULL DEFAULT 1,
  grace_period_days INTEGER NOT NULL DEFAULT 0,
  late_fee_type TEXT DEFAULT 'fixed',
  late_fee_amount NUMERIC DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on payment_plans" ON public.payment_plans FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own payment_plans" ON public.payment_plans FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- 10. Payment Plan Installments
CREATE TABLE public.payment_plan_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.payment_plans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  due_date DATE NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payment_plan_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on payment_plan_installments" ON public.payment_plan_installments FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own installments" ON public.payment_plan_installments FOR SELECT
  USING (plan_id IN (SELECT pp.id FROM payment_plans pp JOIN user_credentials uc ON uc.student_id = pp.student_id WHERE uc.user_id = auth.uid()));

-- 11. Discounts
CREATE TABLE public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC NOT NULL DEFAULT 0,
  applies_to TEXT NOT NULL DEFAULT 'all',
  fee_item_ids UUID[],
  max_cap NUMERIC,
  stackable BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  required_documents TEXT[],
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on discounts" ON public.discounts FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view active discounts" ON public.discounts FOR SELECT
  USING (is_active = true);

-- 12. Student Discounts
CREATE TABLE public.student_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  discount_id UUID NOT NULL REFERENCES public.discounts(id),
  assessment_id UUID REFERENCES public.student_assessments(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  applied_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_discounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on student_discounts" ON public.student_discounts FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own discounts" ON public.student_discounts FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- 13. Finance Clearance
CREATE TABLE public.finance_clearance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  is_cleared BOOLEAN NOT NULL DEFAULT false,
  cleared_at TIMESTAMPTZ,
  cleared_by UUID,
  balance_threshold NUMERIC DEFAULT 0,
  blocks_exams BOOLEAN NOT NULL DEFAULT true,
  blocks_grades BOOLEAN NOT NULL DEFAULT true,
  blocks_enrollment BOOLEAN NOT NULL DEFAULT true,
  auto_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_finance_clearance_student ON public.finance_clearance(student_id);
CREATE INDEX idx_finance_clearance_school ON public.finance_clearance(school_id);
ALTER TABLE public.finance_clearance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on finance_clearance" ON public.finance_clearance FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Registrar can view finance_clearance" ON public.finance_clearance FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));
CREATE POLICY "Students can view own clearance" ON public.finance_clearance FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- 14. Clearance Rules
CREATE TABLE public.clearance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  threshold NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clearance_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on clearance_rules" ON public.clearance_rules FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 15. Finance Settings
CREATE TABLE public.finance_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  academic_year_id UUID REFERENCES public.academic_years(id),
  default_payment_terms TEXT DEFAULT 'cash',
  late_fee_enabled BOOLEAN NOT NULL DEFAULT false,
  late_fee_type TEXT DEFAULT 'fixed',
  late_fee_amount NUMERIC DEFAULT 0,
  refund_policy TEXT,
  or_number_format TEXT DEFAULT 'OR-{YYYY}-{SEQ}',
  or_next_number INTEGER DEFAULT 1,
  ar_number_format TEXT DEFAULT 'AR-{YYYY}-{SEQ}',
  ar_next_number INTEGER DEFAULT 1,
  convenience_fee_mode TEXT DEFAULT 'absorb',
  convenience_fee_amount NUMERIC DEFAULT 0,
  clearance_threshold NUMERIC DEFAULT 0,
  auto_clearance BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(school_id, academic_year_id)
);
ALTER TABLE public.finance_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on finance_settings" ON public.finance_settings FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 16. Finance Audit Logs
CREATE TABLE public.finance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_finance_audit_logs_school ON public.finance_audit_logs(school_id);
ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on finance_audit_logs" ON public.finance_audit_logs FOR ALL
  USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 17. Payment proofs storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Finance can upload payment proofs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Finance can view payment proofs" ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs' AND (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Finance can delete payment proofs" ON storage.objects FOR DELETE
  USING (bucket_id = 'payment-proofs' AND (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

-- 18. Updated_at triggers
CREATE TRIGGER update_fee_catalog_updated_at BEFORE UPDATE ON public.fee_catalog FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_fee_templates_updated_at BEFORE UPDATE ON public.fee_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_assessments_updated_at BEFORE UPDATE ON public.student_assessments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_clearance_updated_at BEFORE UPDATE ON public.finance_clearance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clearance_rules_updated_at BEFORE UPDATE ON public.clearance_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_finance_settings_updated_at BEFORE UPDATE ON public.finance_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
