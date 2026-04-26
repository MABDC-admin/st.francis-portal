-- Remove teacher CRUD access from class schedules.
-- Teachers should use their read-only schedule and classes views instead.

DROP POLICY IF EXISTS "Staff manage schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Admins manage schedules" ON public.class_schedules;
DROP POLICY IF EXISTS "Registrars manage schedules" ON public.class_schedules;

CREATE POLICY "Admins manage schedules"
ON public.class_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Registrars manage schedules"
ON public.class_schedules
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'registrar'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'registrar'::public.app_role));
