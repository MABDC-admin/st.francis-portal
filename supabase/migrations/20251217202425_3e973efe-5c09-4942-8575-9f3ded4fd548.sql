-- Create teachers table
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  employee_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  subjects TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins and registrars can view all teachers"
ON public.teachers FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Admins can manage teachers"
ON public.teachers FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrars can insert teachers"
ON public.teachers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Registrars can update teachers"
ON public.teachers FOR UPDATE
USING (public.has_role(auth.uid(), 'registrar'));

-- Trigger for updated_at
CREATE TRIGGER update_teachers_updated_at
BEFORE UPDATE ON public.teachers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();