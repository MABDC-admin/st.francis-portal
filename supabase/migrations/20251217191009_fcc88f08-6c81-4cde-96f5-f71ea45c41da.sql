-- Add photo_url column to students table
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url text;

-- Create student_documents table
CREATE TABLE IF NOT EXISTS public.student_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_url text,
  slot_number integer NOT NULL CHECK (slot_number >= 1 AND slot_number <= 6),
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, slot_number)
);

-- Enable RLS on student_documents
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for student_documents
CREATE POLICY "Anyone can view student documents"
ON public.student_documents FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert student documents"
ON public.student_documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update student documents"
ON public.student_documents FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete student documents"
ON public.student_documents FOR DELETE
USING (true);

-- Create storage bucket for student photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student-photos bucket
CREATE POLICY "Anyone can view student photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-photos');

CREATE POLICY "Anyone can upload student photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-photos');

CREATE POLICY "Anyone can update student photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-photos');

CREATE POLICY "Anyone can delete student photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-photos');

-- Storage policies for student-documents bucket
CREATE POLICY "Anyone can view student documents storage"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-documents');

CREATE POLICY "Anyone can upload student documents storage"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-documents');

CREATE POLICY "Anyone can update student documents storage"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-documents');

CREATE POLICY "Anyone can delete student documents storage"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-documents');