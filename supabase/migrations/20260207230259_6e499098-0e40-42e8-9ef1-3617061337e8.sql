
-- ============================================================
-- Feature 1: Data Validation Issues table
-- ============================================================
CREATE TABLE public.data_validation_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  issue_type TEXT NOT NULL, -- 'missing_birthdate', 'invalid_contact', 'duplicate_student', 'incomplete_requirements'
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning', -- 'error', 'warning', 'info'
  field_name TEXT, -- which field has the issue
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_validation_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage data validation issues"
  ON public.data_validation_issues FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Registrars can view data validation issues"
  ON public.data_validation_issues FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));

-- ============================================================
-- Feature 2: Academic Year Archiving
-- ============================================================
ALTER TABLE public.academic_years
  ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archived_by UUID;

-- Grade snapshots table (immutable copies)
CREATE TABLE public.grade_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  q1_grade NUMERIC,
  q2_grade NUMERIC,
  q3_grade NUMERIC,
  q4_grade NUMERIC,
  final_grade NUMERIC,
  remarks TEXT,
  snapshot_data JSONB, -- full snapshot of grade record at archive time
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage grade snapshots"
  ON public.grade_snapshots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view grade snapshots"
  ON public.grade_snapshots FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'registrar'::app_role));

CREATE POLICY "Students can view own grade snapshots"
  ON public.grade_snapshots FOR SELECT
  USING (student_id IN (SELECT uc.student_id FROM user_credentials uc WHERE uc.user_id = auth.uid()));

-- Archived student status table
CREATE TABLE public.archived_student_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  was_active BOOLEAN NOT NULL DEFAULT true,
  grade_level TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(student_id, academic_year_id)
);

ALTER TABLE public.archived_student_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage archived student status"
  ON public.archived_student_status FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can view archived student status"
  ON public.archived_student_status FOR SELECT
  USING (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'registrar'::app_role));

-- ============================================================
-- Feature 3: Immutable Grades Workflow
-- ============================================================
ALTER TABLE public.student_grades
  ADD COLUMN status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN submitted_by UUID,
  ADD COLUMN submitted_at TIMESTAMPTZ,
  ADD COLUMN approved_by UUID,
  ADD COLUMN approved_at TIMESTAMPTZ,
  ADD COLUMN finalized_by UUID,
  ADD COLUMN finalized_at TIMESTAMPTZ;

-- Grade change requests table
CREATE TABLE public.grade_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_grade_id UUID NOT NULL REFERENCES public.student_grades(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  reason TEXT NOT NULL,
  old_values JSONB NOT NULL,
  new_values JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all change requests"
  ON public.grade_change_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Teachers can create change requests"
  ON public.grade_change_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid() AND (has_role(auth.uid(), 'teacher'::app_role) OR has_role(auth.uid(), 'registrar'::app_role)));

CREATE POLICY "Teachers can view own change requests"
  ON public.grade_change_requests FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "Registrars can view all change requests"
  ON public.grade_change_requests FOR SELECT
  USING (has_role(auth.uid(), 'registrar'::app_role));
