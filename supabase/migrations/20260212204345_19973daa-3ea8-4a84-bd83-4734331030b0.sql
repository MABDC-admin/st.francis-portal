
-- Grant table-level permissions so RLS policies can be evaluated
GRANT SELECT, INSERT ON public.online_registrations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_registrations TO authenticated;
