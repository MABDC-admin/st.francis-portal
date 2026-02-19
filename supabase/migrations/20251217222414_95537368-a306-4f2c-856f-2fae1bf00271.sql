-- Create student_grades table for tracking quarterly grades
CREATE TABLE public.student_grades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES public.academic_years(id),
  q1_grade NUMERIC(5,2),
  q2_grade NUMERIC(5,2),
  q3_grade NUMERIC(5,2),
  q4_grade NUMERIC(5,2),
  final_grade NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN q1_grade IS NOT NULL AND q2_grade IS NOT NULL AND q3_grade IS NOT NULL AND q4_grade IS NOT NULL 
      THEN ROUND((q1_grade + q2_grade + q3_grade + q4_grade) / 4, 2)
      ELSE NULL 
    END
  ) STORED,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, academic_year_id)
);

-- Enable RLS
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can manage all grades"
ON public.student_grades
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Registrars can manage grades"
ON public.student_grades
FOR ALL
USING (has_role(auth.uid(), 'registrar'::app_role));

CREATE POLICY "Teachers can view and update grades"
ON public.student_grades
FOR ALL
USING (has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Students can view own grades"
ON public.student_grades
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_credentials uc
    WHERE uc.user_id = auth.uid() AND uc.student_id = student_grades.student_id
  )
);

-- Create report_templates table for storing uploaded templates
CREATE TABLE public.report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('report_card', 'certificate')),
  file_url TEXT NOT NULL,
  school TEXT DEFAULT 'MABDC',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for templates
CREATE POLICY "Admins can manage templates"
ON public.report_templates
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Registrars can manage templates"
ON public.report_templates
FOR ALL
USING (has_role(auth.uid(), 'registrar'::app_role));

CREATE POLICY "Anyone can view templates"
ON public.report_templates
FOR SELECT
USING (true);

-- Create storage bucket for report templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-templates', 'report-templates', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for report templates
CREATE POLICY "Admins can upload templates"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'report-templates' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'registrar'::app_role)
));

CREATE POLICY "Anyone can view templates"
ON storage.objects
FOR SELECT
USING (bucket_id = 'report-templates');

CREATE POLICY "Admins can delete templates"
ON storage.objects
FOR DELETE
USING (bucket_id = 'report-templates' AND (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'registrar'::app_role)
));

-- Add trigger for updated_at
CREATE TRIGGER update_student_grades_updated_at
BEFORE UPDATE ON public.student_grades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
BEFORE UPDATE ON public.report_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();