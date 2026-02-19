-- Fix RLS policies for students table to allow registrars to access all student data
-- The issue is that registrars with the 'registrar' role should have access regardless of user_school_access

-- Drop and recreate the SELECT policy for students
DROP POLICY IF EXISTS "Users can view students from their schools" ON public.students;

CREATE POLICY "Users can view students from their schools" 
ON public.students 
FOR SELECT 
TO authenticated
USING (
  -- Admin can view all
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  -- Registrar can view all students
  has_role(auth.uid(), 'registrar'::app_role)
  OR
  -- Users with school access can view
  (school_id IN (
    SELECT school_id FROM user_school_access 
    WHERE user_id = auth.uid() AND is_active = true
  ))
  OR
  -- Students can view own record
  EXISTS (
    SELECT 1 FROM user_credentials uc 
    WHERE uc.user_id = auth.uid() AND uc.student_id = students.id
  )
);

-- Fix UPDATE policy
DROP POLICY IF EXISTS "Users can update students in their schools" ON public.students;

CREATE POLICY "Users can update students in their schools" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'registrar'::app_role)
  OR
  (school_id IN (
    SELECT school_id FROM user_school_access 
    WHERE user_id = auth.uid() AND is_active = true 
    AND role IN ('admin', 'registrar')
  ))
);

-- Fix INSERT policy
DROP POLICY IF EXISTS "Users can insert students to their schools" ON public.students;

CREATE POLICY "Users can insert students to their schools" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'registrar'::app_role)
  OR
  (school_id IN (
    SELECT school_id FROM user_school_access 
    WHERE user_id = auth.uid() AND is_active = true 
    AND role IN ('admin', 'registrar')
  ))
);

-- Fix DELETE policy
DROP POLICY IF EXISTS "Users can delete students in their schools" ON public.students;

CREATE POLICY "Users can delete students in their schools" 
ON public.students 
FOR DELETE 
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR 
  has_role(auth.uid(), 'registrar'::app_role)
  OR
  (school_id IN (
    SELECT school_id FROM user_school_access 
    WHERE user_id = auth.uid() AND is_active = true 
    AND role IN ('admin', 'registrar')
  ))
);