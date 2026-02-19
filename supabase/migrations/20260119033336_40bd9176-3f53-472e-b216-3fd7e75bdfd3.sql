-- Add columns for PDF page tracking
ALTER TABLE public.student_documents
ADD COLUMN IF NOT EXISTS page_count integer,
ADD COLUMN IF NOT EXISTS page_images jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS is_pdf_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS parent_document_id uuid REFERENCES public.student_documents(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS page_number integer;

-- Add index for parent document lookup
CREATE INDEX IF NOT EXISTS idx_student_documents_parent 
ON public.student_documents(parent_document_id) 
WHERE parent_document_id IS NOT NULL;

-- Add index for PDF pages ordering
CREATE INDEX IF NOT EXISTS idx_student_documents_page_number 
ON public.student_documents(parent_document_id, page_number) 
WHERE is_pdf_page = true;