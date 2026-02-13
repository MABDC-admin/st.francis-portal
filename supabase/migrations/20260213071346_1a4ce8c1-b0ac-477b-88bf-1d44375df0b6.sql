-- Ensure profile exists for rogelio@sfxsai.com
INSERT INTO public.profiles (id, email, full_name)
VALUES ('fb25dfcc-3058-4bed-9dab-787416b5b7c7', 'rogelio@sfxsai.com', 'Rogelio Torrente')
ON CONFLICT (id) DO NOTHING;

-- Ensure user_roles entry exists with principal role
INSERT INTO public.user_roles (user_id, role)
VALUES ('fb25dfcc-3058-4bed-9dab-787416b5b7c7', 'principal')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'principal';

-- Ensure user_credentials entry exists
INSERT INTO public.user_credentials (user_id, email, temp_password, role)
VALUES ('fb25dfcc-3058-4bed-9dab-787416b5b7c7', 'rogelio@sfxsai.com', 'torrente', 'principal')
ON CONFLICT (user_id) DO UPDATE SET role = 'principal', email = 'rogelio@sfxsai.com';