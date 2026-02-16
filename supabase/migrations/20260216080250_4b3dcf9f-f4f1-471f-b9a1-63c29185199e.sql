-- Re-grant table privileges for teacher_applications to allow public submissions
GRANT INSERT ON public.teacher_applications TO anon;
GRANT INSERT ON public.teacher_applications TO authenticated;
GRANT SELECT ON public.teacher_applications TO authenticated;
