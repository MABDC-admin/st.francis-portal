CREATE POLICY "Admins can delete visits"
ON public.school_visits
FOR DELETE
USING (user_has_school_access(auth.uid(), school_id));