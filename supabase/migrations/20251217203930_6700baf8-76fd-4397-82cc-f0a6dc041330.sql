-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  grade_levels TEXT[] NOT NULL,
  department TEXT,
  units INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create academic_years table
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student_subjects (enrollment) table
CREATE TABLE public.student_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
  grade NUMERIC(5,2),
  status TEXT DEFAULT 'enrolled',
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, subject_id, academic_year_id)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_subjects ENABLE ROW LEVEL SECURITY;

-- Subjects policies
CREATE POLICY "Anyone can view active subjects" ON public.subjects
FOR SELECT USING (is_active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Admins can manage subjects" ON public.subjects
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrars can insert subjects" ON public.subjects
FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Registrars can update subjects" ON public.subjects
FOR UPDATE USING (public.has_role(auth.uid(), 'registrar'));

-- Academic years policies
CREATE POLICY "Anyone can view academic years" ON public.academic_years
FOR SELECT USING (true);

CREATE POLICY "Admins can manage academic years" ON public.academic_years
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Student subjects policies
CREATE POLICY "Admins and registrars can view all enrollments" ON public.student_subjects
FOR SELECT USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'registrar'));

CREATE POLICY "Teachers can view their class enrollments" ON public.student_subjects
FOR SELECT USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Students can view own enrollments" ON public.student_subjects
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_credentials uc 
    WHERE uc.user_id = auth.uid() AND uc.student_id = student_subjects.student_id
  )
);

CREATE POLICY "Admins can manage enrollments" ON public.student_subjects
FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Registrars can manage enrollments" ON public.student_subjects
FOR ALL USING (public.has_role(auth.uid(), 'registrar'));

-- Trigger for updated_at on subjects
CREATE TRIGGER update_subjects_updated_at
BEFORE UPDATE ON public.subjects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();