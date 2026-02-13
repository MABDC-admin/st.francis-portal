
-- Backfill missing profile for rene@sfxsai.com
INSERT INTO public.profiles (id, email, full_name)
VALUES ('7d022361-e814-4d03-ae8d-3c0f58e2c56c', 'rene@sfxsai.com', 'Rene')
ON CONFLICT (id) DO NOTHING;

-- Backfill missing role for rene@sfxsai.com (registrar per user_credentials)
INSERT INTO public.user_roles (user_id, role)
VALUES ('7d022361-e814-4d03-ae8d-3c0f58e2c56c', 'registrar')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also backfill any other auth users missing from profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also backfill any other auth users missing from user_roles (default to student)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL
  AND u.id != '7d022361-e814-4d03-ae8d-3c0f58e2c56c'
ON CONFLICT (user_id, role) DO NOTHING;
