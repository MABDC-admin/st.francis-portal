-- Create student_incidents table for anecdotal/behavior records
CREATE TABLE public.student_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL, -- 'bullying', 'bad_attitude', 'tardiness', 'misconduct', 'positive', 'other'
  title TEXT NOT NULL,
  description TEXT,
  action_taken TEXT,
  reported_by TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'resolved', 'monitoring'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_incidents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view student incidents" 
ON public.student_incidents 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert student incidents" 
ON public.student_incidents 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update student incidents" 
ON public.student_incidents 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete student incidents" 
ON public.student_incidents 
FOR DELETE 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_student_incidents_updated_at
BEFORE UPDATE ON public.student_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();