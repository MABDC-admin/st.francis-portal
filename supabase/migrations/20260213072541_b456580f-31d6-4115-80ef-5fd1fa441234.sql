
-- Add unique constraint on user_id alone (each user has one role)
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Insert the missing role record for ivann@sfxsai.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('33cd4e9e-e789-42b2-9bba-8d29573f4a6a', 'it')
ON CONFLICT (user_id) DO UPDATE SET role = 'it';
