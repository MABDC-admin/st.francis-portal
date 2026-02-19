
-- 1. New table: balance_carry_forwards
CREATE TABLE public.balance_carry_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id),
  school_id UUID NOT NULL REFERENCES public.schools(id),
  from_academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  to_academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  from_assessment_id UUID NOT NULL REFERENCES public.student_assessments(id),
  to_assessment_id UUID REFERENCES public.student_assessments(id),
  carried_amount NUMERIC NOT NULL DEFAULT 0,
  carried_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  carried_by UUID,
  notes TEXT,
  UNIQUE(student_id, from_academic_year_id, to_academic_year_id)
);

ALTER TABLE public.balance_carry_forwards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance and admin full access on balance_carry_forwards"
ON public.balance_carry_forwards
FOR ALL
USING (has_role(auth.uid(), 'finance'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 2. Add is_closed column to student_assessments
ALTER TABLE public.student_assessments ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT false;
