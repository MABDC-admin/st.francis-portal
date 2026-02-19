-- Grant permissions for the public registration form (anon role)
GRANT SELECT, INSERT ON public.online_registrations TO anon;

-- Grant permissions for authenticated users (admin/registrar dashboard)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_registrations TO authenticated;