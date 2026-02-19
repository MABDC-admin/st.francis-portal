-- Migration: Add mother_tongue and dialects to students table
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS mother_tongue TEXT,
ADD COLUMN IF NOT EXISTS dialects TEXT;

COMMENT ON COLUMN public.students.mother_tongue IS 'Primary language spoken at home';
COMMENT ON COLUMN public.students.dialects IS 'Other languages or dialects spoken';
