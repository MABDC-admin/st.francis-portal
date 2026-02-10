
-- ============================================================
-- CRITICAL SECURITY FIX: Replace overly permissive RLS policies
-- ============================================================

-- 1. FIX student_documents: Use student_id to resolve school access
DROP POLICY IF EXISTS "Anyone can view student documents" ON public.student_documents;
DROP POLICY IF EXISTS "Anyone can insert student documents" ON public.student_documents;
DROP POLICY IF EXISTS "Anyone can update student documents" ON public.student_documents;
DROP POLICY IF EXISTS "Anyone can delete student documents" ON public.student_documents;

CREATE POLICY "Staff can view student documents"
ON public.student_documents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can insert student documents"
ON public.student_documents FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can update student documents"
ON public.student_documents FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can delete student documents"
ON public.student_documents FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

-- 2. FIX student_incidents: Use student_id to resolve school access
DROP POLICY IF EXISTS "Anyone can view student incidents" ON public.student_incidents;
DROP POLICY IF EXISTS "Anyone can insert student incidents" ON public.student_incidents;
DROP POLICY IF EXISTS "Anyone can update student incidents" ON public.student_incidents;
DROP POLICY IF EXISTS "Anyone can delete student incidents" ON public.student_incidents;

CREATE POLICY "Staff can view student incidents"
ON public.student_incidents FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can insert student incidents"
ON public.student_incidents FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can update student incidents"
ON public.student_incidents FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

CREATE POLICY "Staff can delete student incidents"
ON public.student_incidents FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_id
    AND public.user_has_school_access(auth.uid(), s.school_id)
  )
);

-- 3. FIX raw_scores: Replace open authenticated access with school-based access
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.raw_scores;

CREATE POLICY "School staff can view raw scores"
ON public.raw_scores FOR SELECT
TO authenticated
USING (
  public.user_has_school_access(auth.uid(), school_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "School staff can insert raw scores"
ON public.raw_scores FOR INSERT
TO authenticated
WITH CHECK (
  public.user_has_school_access(auth.uid(), school_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "School staff can update raw scores"
ON public.raw_scores FOR UPDATE
TO authenticated
USING (
  public.user_has_school_access(auth.uid(), school_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "School staff can delete raw scores"
ON public.raw_scores FOR DELETE
TO authenticated
USING (
  public.user_has_school_access(auth.uid(), school_id)
  OR public.has_role(auth.uid(), 'admin')
);

-- 4. FIX role_permissions: Remove development bypass, restrict to admin only
DROP POLICY IF EXISTS "Development access for role_permissions" ON public.role_permissions;

CREATE POLICY "Admins can manage role permissions"
ON public.role_permissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. FIX finance_audit_logs: Make append-only (no UPDATE/DELETE)
DROP POLICY IF EXISTS "Finance staff can manage audit logs" ON public.finance_audit_logs;
DROP POLICY IF EXISTS "Admins can manage audit logs" ON public.finance_audit_logs;

CREATE POLICY "Finance and admin can view audit logs"
ON public.finance_audit_logs FOR SELECT
TO authenticated
USING (
  public.check_finance_access(school_id)
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Finance and admin can insert audit logs"
ON public.finance_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  public.check_finance_access(school_id)
  OR public.has_role(auth.uid(), 'admin')
);
-- No UPDATE or DELETE policies = audit logs are now immutable
