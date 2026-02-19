-- Add school column to students table
ALTER TABLE public.students 
ADD COLUMN school text DEFAULT 'MABDC';

-- Update all existing students to MABDC
UPDATE public.students SET school = 'MABDC' WHERE school IS NULL;