-- Teacher Portal Phase: Lesson Plans + Requests

CREATE OR REPLACE FUNCTION public.current_teacher_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT t.id
      FROM public.teachers t
      WHERE t.user_id = auth.uid()
      LIMIT 1
    ),
    (
      SELECT uc.teacher_id
      FROM public.user_credentials uc
      WHERE uc.user_id = auth.uid()
        AND uc.teacher_id IS NOT NULL
      LIMIT 1
    )
  )
$$;

REVOKE ALL ON FUNCTION public.current_teacher_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_teacher_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_teacher_id() TO service_role;

CREATE TABLE IF NOT EXISTS public.teacher_lesson_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id),
  class_schedule_id uuid REFERENCES public.class_schedules(id) ON DELETE SET NULL,
  subject_id uuid NOT NULL REFERENCES public.subjects(id),
  title text NOT NULL,
  plan_date date NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  objectives text,
  competencies text,
  materials text,
  procedures text,
  assessment text,
  homework text,
  notes text,
  review_notes text,
  reviewed_by uuid REFERENCES public.profiles(id),
  reviewed_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  teacher_id uuid NOT NULL REFERENCES public.teachers(id),
  request_type text NOT NULL CHECK (
    request_type IN (
      'grade_submission',
      'class_list_correction',
      'schedule_adjustment',
      'lesson_plan_submission',
      'report_submission',
      'document_request',
      'other'
    )
  ),
  subject text NOT NULL,
  details text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'completed')),
  requested_for_date date,
  resolution_notes text,
  resolved_by uuid REFERENCES public.profiles(id),
  resolved_at timestamptz,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_lesson_plans_teacher_date
  ON public.teacher_lesson_plans(teacher_id, plan_date DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_lesson_plans_school_year
  ON public.teacher_lesson_plans(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_lesson_plans_status
  ON public.teacher_lesson_plans(status);

CREATE INDEX IF NOT EXISTS idx_teacher_requests_teacher_created
  ON public.teacher_requests(teacher_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teacher_requests_school_year
  ON public.teacher_requests(school_id, academic_year_id);
CREATE INDEX IF NOT EXISTS idx_teacher_requests_status
  ON public.teacher_requests(status);

ALTER TABLE public.teacher_lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teachers can view own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can insert own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can update own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Teachers can delete own lesson plans" ON public.teacher_lesson_plans;
DROP POLICY IF EXISTS "Staff can manage lesson plans" ON public.teacher_lesson_plans;

CREATE POLICY "Teachers can view own lesson plans"
ON public.teacher_lesson_plans
FOR SELECT
USING (
  teacher_id = public.current_teacher_id() OR created_by = auth.uid()
);

CREATE POLICY "Teachers can insert own lesson plans"
ON public.teacher_lesson_plans
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
  AND created_by = auth.uid()
);

CREATE POLICY "Teachers can update own lesson plans"
ON public.teacher_lesson_plans
FOR UPDATE
USING (
  teacher_id = public.current_teacher_id()
)
WITH CHECK (
  teacher_id = public.current_teacher_id()
);

CREATE POLICY "Teachers can delete own lesson plans"
ON public.teacher_lesson_plans
FOR DELETE
USING (
  teacher_id = public.current_teacher_id()
);

CREATE POLICY "Staff can manage lesson plans"
ON public.teacher_lesson_plans
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  OR public.has_role(auth.uid(), 'principal'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  OR public.has_role(auth.uid(), 'principal'::public.app_role)
);

DROP POLICY IF EXISTS "Teachers can view own requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Teachers can insert own requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Teachers can update own requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Teachers can delete own requests" ON public.teacher_requests;
DROP POLICY IF EXISTS "Staff can manage requests" ON public.teacher_requests;

CREATE POLICY "Teachers can view own requests"
ON public.teacher_requests
FOR SELECT
USING (
  teacher_id = public.current_teacher_id() OR created_by = auth.uid()
);

CREATE POLICY "Teachers can insert own requests"
ON public.teacher_requests
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND teacher_id = public.current_teacher_id()
  AND created_by = auth.uid()
);

CREATE POLICY "Teachers can update own requests"
ON public.teacher_requests
FOR UPDATE
USING (
  teacher_id = public.current_teacher_id()
  AND status IN ('pending', 'rejected')
)
WITH CHECK (
  teacher_id = public.current_teacher_id()
);

CREATE POLICY "Teachers can delete own requests"
ON public.teacher_requests
FOR DELETE
USING (
  teacher_id = public.current_teacher_id()
  AND status = 'pending'
);

CREATE POLICY "Staff can manage requests"
ON public.teacher_requests
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  OR public.has_role(auth.uid(), 'principal'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  OR public.has_role(auth.uid(), 'principal'::public.app_role)
);

DROP TRIGGER IF EXISTS update_teacher_lesson_plans_updated_at ON public.teacher_lesson_plans;
CREATE TRIGGER update_teacher_lesson_plans_updated_at
BEFORE UPDATE ON public.teacher_lesson_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teacher_requests_updated_at ON public.teacher_requests;
CREATE TRIGGER update_teacher_requests_updated_at
BEFORE UPDATE ON public.teacher_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
