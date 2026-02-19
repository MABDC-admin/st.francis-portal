
-- Add mobile_number column to online_registrations
ALTER TABLE public.online_registrations ADD COLUMN mobile_number text;

-- Add mobile_number column to admissions
ALTER TABLE public.admissions ADD COLUMN mobile_number text;
