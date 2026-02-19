-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lrn TEXT NOT NULL UNIQUE,
  student_name TEXT NOT NULL,
  level TEXT NOT NULL,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  mother_contact TEXT,
  mother_maiden_name TEXT,
  father_contact TEXT,
  father_name TEXT,
  phil_address TEXT,
  uae_address TEXT,
  previous_school TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (for now, can be restricted later)
CREATE POLICY "Anyone can view students" 
ON public.students 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can insert students" 
ON public.students 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Anyone can update students" 
ON public.students 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete students" 
ON public.students 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_students_level ON public.students(level);
CREATE INDEX idx_students_gender ON public.students(gender);
CREATE INDEX idx_students_lrn ON public.students(lrn);