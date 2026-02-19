-- Add school column to teachers table
ALTER TABLE public.teachers 
ADD COLUMN school text DEFAULT 'MABDC';

-- Update existing teachers to have MABDC as default school
UPDATE public.teachers SET school = 'MABDC' WHERE school IS NULL;