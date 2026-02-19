
-- Add teacher_id to user_credentials for linking teacher accounts
ALTER TABLE public.user_credentials 
ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES public.teachers(id) ON DELETE SET NULL;

-- Add RLS policy allowing teachers to view their own record
CREATE POLICY "Teachers can view own record"
ON public.teachers
FOR SELECT
USING (user_id = auth.uid());
