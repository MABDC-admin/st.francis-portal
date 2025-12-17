-- Add unique constraint for student_grades to enable upsert on import
ALTER TABLE public.student_grades 
ADD CONSTRAINT student_grades_unique_student_subject_year 
UNIQUE (student_id, subject_id, academic_year_id);