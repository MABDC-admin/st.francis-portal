-- Add unique constraint on user_id for user_credentials to support upserts
ALTER TABLE public.user_credentials ADD CONSTRAINT user_credentials_user_id_unique UNIQUE (user_id);