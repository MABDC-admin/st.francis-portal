-- Drop and recreate the INSERT policy to allow both anon and authenticated users
DROP POLICY "Allow anonymous insert on teacher_applications" ON public.teacher_applications;

CREATE POLICY "Allow public insert on teacher_applications"
ON public.teacher_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);