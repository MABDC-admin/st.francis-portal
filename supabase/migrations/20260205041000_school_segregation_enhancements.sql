-- Migration: School Segregation Enhancements
-- Adds RLS policies, user-school associations, audit logging, and monitoring

-- ============================================================================
-- PART 1: User-School Association Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_school_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'registrar', 'teacher', 'viewer')),
  granted_by UUID,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, school_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_school_access_user 
ON public.user_school_access(user_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_school_access_school 
ON public.user_school_access(school_id) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.user_school_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access
CREATE POLICY "Users can view their own school access" 
ON public.user_school_access
FOR SELECT USING (user_id = auth.uid());

-- Admins can manage all access
CREATE POLICY "Admins can manage school access" 
ON public.user_school_access
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.user_school_access IS 
'Tracks which users have access to which schools and their roles';

-- ============================================================================
-- PART 2: Audit Logging Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT'
  table_name TEXT NOT NULL,
  record_id UUID,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Partition by month for performance (optional, can be added later)
CREATE INDEX IF NOT EXISTS idx_school_access_logs_created 
ON public.school_access_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_access_logs_user 
ON public.school_access_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_access_logs_school 
ON public.school_access_logs(school_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.school_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view logs
CREATE POLICY "Admins can view all access logs" 
ON public.school_access_logs
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- System can insert logs (no user restriction)
CREATE POLICY "System can insert access logs" 
ON public.school_access_logs
FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.school_access_logs IS 
'Audit trail of all school data access and modifications';

-- ============================================================================
-- PART 3: School Switching History
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.school_switch_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  to_school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  from_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  to_academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  switched_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_switch_log_user 
ON public.school_switch_log(user_id, switched_at DESC);

CREATE INDEX IF NOT EXISTS idx_school_switch_log_time 
ON public.school_switch_log(switched_at DESC);

-- Enable RLS
ALTER TABLE public.school_switch_log ENABLE ROW LEVEL SECURITY;

-- Users can view their own switch history
CREATE POLICY "Users can view their own switch history" 
ON public.school_switch_log
FOR SELECT USING (user_id = auth.uid());

-- Admins can view all switch history
CREATE POLICY "Admins can view all switch history" 
ON public.school_switch_log
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert (for tracking)
CREATE POLICY "Anyone can log school switches" 
ON public.school_switch_log
FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.school_switch_log IS 
'Tracks when users switch between schools and academic years';

-- ============================================================================
-- PART 4: Enhanced RLS Policies for Data Tables
-- ============================================================================

-- Drop existing permissive policies and add school-filtered ones

-- Students table
DROP POLICY IF EXISTS "Anyone can view students" ON public.students;
DROP POLICY IF EXISTS "Anyone can insert students" ON public.students;
DROP POLICY IF EXISTS "Anyone can update students" ON public.students;
DROP POLICY IF EXISTS "Anyone can delete students" ON public.students;

-- New school-aware policies
CREATE POLICY "Users can view students from their schools" 
ON public.students
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert students to their schools" 
ON public.students
FOR INSERT WITH CHECK (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('admin', 'registrar')
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update students in their schools" 
ON public.students
FOR UPDATE USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('admin', 'registrar')
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete students in their schools" 
ON public.students
FOR DELETE USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('admin', 'registrar')
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Raw scores table
ALTER TABLE public.raw_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view raw scores from their schools" 
ON public.raw_scores
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can manage raw scores in their schools" 
ON public.raw_scores
FOR ALL USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('admin', 'registrar', 'teacher')
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Student subjects table
DROP POLICY IF EXISTS "Admins and registrars can view all enrollments" ON public.student_subjects;
DROP POLICY IF EXISTS "Teachers can view their class enrollments" ON public.student_subjects;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.student_subjects;
DROP POLICY IF EXISTS "Registrars can manage enrollments" ON public.student_subjects;

CREATE POLICY "Users can view enrollments from their schools" 
ON public.student_subjects
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can manage enrollments in their schools" 
ON public.student_subjects
FOR ALL USING (
  school_id IN (
    SELECT school_id FROM public.user_school_access 
    WHERE user_id = auth.uid() 
    AND is_active = true
    AND role IN ('admin', 'registrar')
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- ============================================================================
-- PART 5: Helper Functions
-- ============================================================================

-- Function to check if user has access to a school
CREATE OR REPLACE FUNCTION public.user_has_school_access(
  p_user_id UUID,
  p_school_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_school_access
    WHERE user_id = p_user_id
    AND school_id = p_school_id
    AND is_active = true
  ) OR public.has_role(p_user_id, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's accessible schools
CREATE OR REPLACE FUNCTION public.get_user_schools(p_user_id UUID)
RETURNS TABLE (
  school_id UUID,
  school_name TEXT,
  school_code TEXT,
  user_role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.code,
    usa.role
  FROM public.schools s
  JOIN public.user_school_access usa ON s.id = usa.school_id
  WHERE usa.user_id = p_user_id
  AND usa.is_active = true
  AND s.is_active = true
  ORDER BY s.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log access
CREATE OR REPLACE FUNCTION public.log_school_access(
  p_user_id UUID,
  p_school_id UUID,
  p_academic_year_id UUID,
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.school_access_logs (
    user_id,
    school_id,
    academic_year_id,
    action,
    table_name,
    record_id,
    success,
    error_message
  ) VALUES (
    p_user_id,
    p_school_id,
    p_academic_year_id,
    p_action,
    p_table_name,
    p_record_id,
    p_success,
    p_error_message
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PART 6: Performance Monitoring View
-- ============================================================================

CREATE OR REPLACE VIEW public.school_access_stats AS
SELECT 
  s.name as school_name,
  sal.action,
  sal.table_name,
  COUNT(*) as access_count,
  COUNT(DISTINCT sal.user_id) as unique_users,
  DATE_TRUNC('day', sal.created_at) as access_date
FROM public.school_access_logs sal
JOIN public.schools s ON sal.school_id = s.id
WHERE sal.created_at >= NOW() - INTERVAL '30 days'
GROUP BY s.name, sal.action, sal.table_name, DATE_TRUNC('day', sal.created_at)
ORDER BY access_date DESC, access_count DESC;

COMMENT ON VIEW public.school_access_stats IS 
'Summary statistics of school data access for the last 30 days';

-- ============================================================================
-- PART 7: Data Export Tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL, -- 'PDF', 'XLSX', 'CSV'
  table_name TEXT NOT NULL,
  record_count INTEGER,
  file_name TEXT,
  file_size_bytes BIGINT,
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_data_exports_user 
ON public.data_exports(user_id, exported_at DESC);

CREATE INDEX IF NOT EXISTS idx_data_exports_school 
ON public.data_exports(school_id, exported_at DESC);

-- Enable RLS
ALTER TABLE public.data_exports ENABLE ROW LEVEL SECURITY;

-- Users can view their own exports
CREATE POLICY "Users can view their own exports" 
ON public.data_exports
FOR SELECT USING (user_id = auth.uid());

-- Admins can view all exports
CREATE POLICY "Admins can view all exports" 
ON public.data_exports
FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can insert their own exports
CREATE POLICY "Users can log their exports" 
ON public.data_exports
FOR INSERT WITH CHECK (user_id = auth.uid());

COMMENT ON TABLE public.data_exports IS 
'Tracks all data exports with school and academic year context';

-- ============================================================================
-- PART 8: Comments and Documentation
-- ============================================================================

COMMENT ON FUNCTION public.user_has_school_access IS 
'Checks if a user has access to a specific school';

COMMENT ON FUNCTION public.get_user_schools IS 
'Returns all schools accessible to a user with their role';

COMMENT ON FUNCTION public.log_school_access IS 
'Logs a school data access event for audit trail';
