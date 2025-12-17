-- Create a table to store temporary credentials for admin to view
CREATE TABLE public.user_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  temp_password TEXT NOT NULL,
  role TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  password_changed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Only admins can view credentials
CREATE POLICY "Only admins can view credentials"
ON public.user_credentials
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete credentials
CREATE POLICY "Only admins can delete credentials"
ON public.user_credentials
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Service role can insert (for edge function)
CREATE POLICY "Service role can insert credentials"
ON public.user_credentials
FOR INSERT
WITH CHECK (true);