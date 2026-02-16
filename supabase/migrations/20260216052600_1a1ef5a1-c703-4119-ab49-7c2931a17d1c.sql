-- Grant necessary table-level privileges for teacher_applications
GRANT INSERT ON public.teacher_applications TO anon, authenticated;
GRANT SELECT ON public.teacher_applications TO anon, authenticated;