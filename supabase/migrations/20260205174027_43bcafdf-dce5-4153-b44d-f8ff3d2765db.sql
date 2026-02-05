-- Add policy to allow users to view their own credentials record
-- This is needed for the students table RLS policy which checks user_credentials
CREATE POLICY "Users can view their own credentials"
ON public.user_credentials
FOR SELECT
USING (user_id = auth.uid());

-- Also add policy to student_grades so students can see their own grades
-- First check current policies
DROP POLICY IF EXISTS "Students can view their own grades" ON public.student_grades;

CREATE POLICY "Students can view their own grades"
ON public.student_grades
FOR SELECT
USING (
  student_id IN (
    SELECT uc.student_id 
    FROM user_credentials uc 
    WHERE uc.user_id = auth.uid()
  )
);