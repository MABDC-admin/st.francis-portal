-- Migration: Library Refactor
-- Adds category, source, and teacher-only flag to books table
-- Implements stricter RLS for student access

-- Add new columns to books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Ebook',
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Internal',
ADD COLUMN IF NOT EXISTS is_teacher_only BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_books_category ON public.books(category);
CREATE INDEX IF NOT EXISTS idx_books_grade_level ON public.books(grade_level);

-- Drop old RLS policies to recreate them with stricter rules
DROP POLICY IF EXISTS "Anyone can view active books" ON public.books;
DROP POLICY IF EXISTS "Anyone can view book pages" ON public.book_pages;

-- Re-implement Policies for public.books
CREATE POLICY "Admins and Registrars have full access to books"
ON public.books
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'registrar'::app_role)
);

CREATE POLICY "Teachers can view all active books and manage their school's"
ON public.books
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher'::app_role) AND is_active = true
);

CREATE POLICY "Teachers can manage school books"
ON public.books
FOR ALL
USING (
  public.has_role(auth.uid(), 'teacher'::app_role) AND 
  (school IS NULL OR EXISTS (
    SELECT 1 FROM public.teachers t 
    WHERE t.user_id = auth.uid() AND t.school = books.school
  ))
);

CREATE POLICY "Students can view appropriate active books"
ON public.books
FOR SELECT
USING (
  is_active = true AND 
  is_teacher_only = false AND
  (
    -- Access to school-neutral books or school-specific books
    school IS NULL OR 
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.user_credentials uc ON uc.student_id = s.id
      WHERE uc.user_id = auth.uid() AND s.school_id::text = books.school
    )
  ) AND
  (
    -- Grade level check
    EXISTS (
      SELECT 1 FROM public.students s
      JOIN public.user_credentials uc ON uc.student_id = s.id
      WHERE uc.user_id = auth.uid() AND (
        (s.level ILIKE '%kinder%' AND books.grade_level = 0) OR
        (s.level ~ E'\\d+' AND (s.level::text ~ E'\\d+' AND (regexp_replace(s.level, E'[^0-9]', '', 'g')::int = books.grade_level)))
      )
    )
  )
);

-- Re-implement Policies for public.book_pages
CREATE POLICY "Users can view pages of books they can see"
ON public.book_pages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.books b
    WHERE b.id = book_pages.book_id
  )
);

CREATE POLICY "Admins and Registrars can manage book pages"
ON public.book_pages
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR 
  public.has_role(auth.uid(), 'registrar'::app_role)
);
