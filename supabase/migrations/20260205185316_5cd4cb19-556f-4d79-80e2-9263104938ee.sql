-- Create books table
CREATE TABLE IF NOT EXISTS public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  grade_level INTEGER NOT NULL,
  subject TEXT,
  cover_url TEXT,
  pdf_url TEXT,
  page_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  school TEXT,
  uploaded_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create book_pages table
CREATE TABLE IF NOT EXISTS public.book_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (book_id, page_number)
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for books
CREATE POLICY "Anyone can view active books" ON public.books
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage books" ON public.books
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Registrars can manage books" ON public.books
  FOR ALL USING (has_role(auth.uid(), 'registrar'::app_role));

-- RLS Policies for book_pages
CREATE POLICY "Anyone can view book pages" ON public.book_pages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage book pages" ON public.book_pages
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Registrars can manage book pages" ON public.book_pages
  FOR ALL USING (has_role(auth.uid(), 'registrar'::app_role));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('book-pages', 'book-pages', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('pdf-uploads', 'pdf-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for book-pages (public read, authenticated write)
CREATE POLICY "Public read access for book pages"
ON storage.objects FOR SELECT
USING (bucket_id = 'book-pages');

CREATE POLICY "Authenticated users can upload book pages"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'book-pages' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete book pages"
ON storage.objects FOR DELETE
USING (bucket_id = 'book-pages' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for pdf-uploads (private bucket)
CREATE POLICY "Authenticated users can upload PDFs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdf-uploads' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can read PDFs"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdf-uploads' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete PDFs"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdf-uploads' AND has_role(auth.uid(), 'admin'::app_role));