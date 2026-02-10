-- Add strand column to students table for DepEd K-12 Senior High School curriculum
-- Grade 11 and Grade 12 students require strand selection (ABM, STEM, HUMSS, GAS, TVL, etc.)

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS strand TEXT;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.students.strand IS 'Senior High School strand for Grade 11-12 students (e.g., ABM, STEM, HUMSS, GAS, TVL-ICT, etc.)';

-- Create index for efficient filtering by strand
CREATE INDEX IF NOT EXISTS idx_students_strand ON public.students(strand) WHERE strand IS NOT NULL;

-- Add strand column to admissions table as well
ALTER TABLE public.admissions 
ADD COLUMN IF NOT EXISTS strand TEXT;

COMMENT ON COLUMN public.admissions.strand IS 'Senior High School strand for Grade 11-12 applicants';

CREATE INDEX IF NOT EXISTS idx_admissions_strand ON public.admissions(strand) WHERE strand IS NOT NULL;
