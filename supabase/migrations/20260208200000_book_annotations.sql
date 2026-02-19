-- Create book_annotations table for stickers and drawings
CREATE TABLE IF NOT EXISTS public.book_annotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'sticker', 'pencil', 'highlighter', etc.
    data JSONB NOT NULL, -- stores coordinates, size, value, points, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.book_annotations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can create their own annotations"
    ON public.book_annotations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own annotations"
    ON public.book_annotations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own annotations"
    ON public.book_annotations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own annotations"
    ON public.book_annotations FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_book_annotations_book_page ON public.book_annotations(book_id, page_number);
CREATE INDEX IF NOT EXISTS idx_book_annotations_user ON public.book_annotations(user_id);
