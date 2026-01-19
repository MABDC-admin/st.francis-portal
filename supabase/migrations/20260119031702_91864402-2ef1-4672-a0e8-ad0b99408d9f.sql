-- Add metadata columns to student_documents for AI analysis
ALTER TABLE public.student_documents 
ADD COLUMN IF NOT EXISTS extracted_text TEXT,
ADD COLUMN IF NOT EXISTS detected_type TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS detected_language TEXT,
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2),
ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS original_filename TEXT;

-- Create index for full-text search on extracted text
CREATE INDEX IF NOT EXISTS idx_student_documents_extracted_text 
ON public.student_documents USING GIN (to_tsvector('english', COALESCE(extracted_text, '')));

-- Create index for keywords array search
CREATE INDEX IF NOT EXISTS idx_student_documents_keywords 
ON public.student_documents USING GIN (keywords);

-- Create index for document type filtering
CREATE INDEX IF NOT EXISTS idx_student_documents_detected_type 
ON public.student_documents (detected_type);

-- Create index for analysis status
CREATE INDEX IF NOT EXISTS idx_student_documents_analysis_status 
ON public.student_documents (analysis_status);