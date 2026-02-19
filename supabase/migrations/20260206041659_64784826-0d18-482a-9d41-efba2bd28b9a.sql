-- Create book_page_index table for AI-powered search
CREATE TABLE public.book_page_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.book_pages(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  extracted_text TEXT,
  topics TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  chapter_title TEXT,
  summary TEXT,
  indexed_at TIMESTAMPTZ,
  index_status TEXT NOT NULL DEFAULT 'pending' CHECK (index_status IN ('pending', 'processing', 'completed', 'error')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Generated column for full-text search
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(extracted_text, '') || ' ' || COALESCE(chapter_title, '') || ' ' || COALESCE(summary, ''))
  ) STORED,
  UNIQUE(book_id, page_id)
);

-- Add index_status column to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS index_status TEXT DEFAULT 'pending';

-- Create GIN index for full-text search on the generated column
CREATE INDEX idx_book_page_index_fts ON public.book_page_index USING gin(search_vector);

-- Create separate GIN indexes for array columns
CREATE INDEX idx_book_page_index_topics ON public.book_page_index USING gin(topics);
CREATE INDEX idx_book_page_index_keywords ON public.book_page_index USING gin(keywords);

-- Create index for faster book lookups
CREATE INDEX idx_book_page_index_book_id ON public.book_page_index(book_id);
CREATE INDEX idx_book_page_index_status ON public.book_page_index(index_status);
CREATE INDEX idx_books_index_status ON public.books(index_status);

-- Enable RLS
ALTER TABLE public.book_page_index ENABLE ROW LEVEL SECURITY;

-- RLS policies for book_page_index (same access as books - public read for active books)
CREATE POLICY "Anyone can view indexed pages for active books"
ON public.book_page_index
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.books 
    WHERE books.id = book_page_index.book_id 
    AND books.is_active = true
  )
);

-- Authenticated users can manage indexing
CREATE POLICY "Authenticated users can insert page index"
ON public.book_page_index
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update page index"
ON public.book_page_index
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete page index"
ON public.book_page_index
FOR DELETE
TO authenticated
USING (true);

-- Trigger to update updated_at
CREATE TRIGGER update_book_page_index_updated_at
BEFORE UPDATE ON public.book_page_index
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();