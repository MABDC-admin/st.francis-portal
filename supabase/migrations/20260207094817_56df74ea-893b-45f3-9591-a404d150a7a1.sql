
-- Add page detection columns to book_pages table
ALTER TABLE public.book_pages 
  ADD COLUMN IF NOT EXISTS detected_page_number text,
  ADD COLUMN IF NOT EXISTS page_type text DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS detection_confidence numeric,
  ADD COLUMN IF NOT EXISTS detection_completed boolean DEFAULT false;
