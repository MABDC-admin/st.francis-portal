CREATE OR REPLACE FUNCTION public.normalize_library_grade_level(value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  raw text := lower(trim(coalesce(value, '')));
  digits text;
BEGIN
  IF raw = '' THEN
    RETURN '';
  END IF;

  IF raw IN ('0', 'kinder', 'kindergarten') OR raw LIKE 'kinder %' THEN
    RETURN 'kindergarten';
  END IF;

  digits := substring(raw FROM '([0-9]{1,2})');
  IF digits IS NOT NULL THEN
    RETURN 'grade' || digits;
  END IF;

  RETURN regexp_replace(raw, '\s+', '', 'g');
END;
$$;

CREATE OR REPLACE FUNCTION public.book_matches_school_scope(
  _book_school text,
  _school_id uuid,
  _school_code text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    coalesce(nullif(btrim(_book_school), ''), null) IS NULL
    OR (_school_code IS NOT NULL AND lower(btrim(_book_school)) = lower(btrim(_school_code)))
    OR (_school_id IS NOT NULL AND btrim(_book_school) = _school_id::text);
$$;

CREATE OR REPLACE FUNCTION public.teacher_can_access_library_book(
  _user_id uuid,
  _book_school text,
  _book_grade text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_grade_levels(_user_id) scoped
    JOIN public.schools school_row ON school_row.id = scoped.school_id
    WHERE public.book_matches_school_scope(_book_school, school_row.id, school_row.code)
      AND public.normalize_library_grade_level(_book_grade) =
          public.normalize_library_grade_level(scoped.grade_level)
  )
  OR EXISTS (
    SELECT 1
    FROM public.teachers teacher_row
    LEFT JOIN public.schools school_row
      ON lower(btrim(school_row.code)) = lower(btrim(coalesce(teacher_row.school, '')))
    WHERE teacher_row.id = public.current_teacher_id()
      AND public.normalize_library_grade_level(coalesce(teacher_row.grade_level, '')) =
          public.normalize_library_grade_level(_book_grade)
      AND (
        coalesce(nullif(btrim(_book_school), ''), null) IS NULL
        OR lower(btrim(_book_school)) = lower(btrim(coalesce(teacher_row.school, '')))
        OR (
          school_row.id IS NOT NULL
          AND (
            btrim(_book_school) = school_row.id::text
            OR lower(btrim(_book_school)) = lower(btrim(school_row.code))
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.student_can_access_library_book(
  _user_id uuid,
  _book_school text,
  _book_grade text,
  _is_teacher_only boolean
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT coalesce(_is_teacher_only, false)
    AND EXISTS (
      SELECT 1
      FROM public.user_credentials credential
      JOIN public.students student_row
        ON student_row.id = credential.student_id
      JOIN public.schools school_row
        ON school_row.id = student_row.school_id
      WHERE credential.user_id = _user_id
        AND public.normalize_library_grade_level(student_row.level) =
            public.normalize_library_grade_level(_book_grade)
        AND public.book_matches_school_scope(_book_school, school_row.id, school_row.code)
    );
$$;

REVOKE ALL ON FUNCTION public.normalize_library_grade_level(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_matches_school_scope(text, uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teacher_can_access_library_book(uuid, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.student_can_access_library_book(uuid, text, text, boolean) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.normalize_library_grade_level(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.book_matches_school_scope(text, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_can_access_library_book(uuid, text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_can_access_library_book(uuid, text, text, boolean) TO authenticated, service_role;

DROP POLICY IF EXISTS "Anyone can view active books" ON public.books;
DROP POLICY IF EXISTS "Admins can manage books" ON public.books;
DROP POLICY IF EXISTS "Registrars can manage books" ON public.books;
DROP POLICY IF EXISTS "Admins and Registrars have full access to books" ON public.books;
DROP POLICY IF EXISTS "Teachers can view all active books and manage their school's" ON public.books;
DROP POLICY IF EXISTS "Teachers can manage school books" ON public.books;
DROP POLICY IF EXISTS "Students can view appropriate active books" ON public.books;
DROP POLICY IF EXISTS "Staff can view active books in accessible schools" ON public.books;

CREATE POLICY "Admins and Registrars have full access to books"
ON public.books
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

CREATE POLICY "Teachers can view assigned-grade active books"
ON public.books
FOR SELECT
USING (
  public.has_role(auth.uid(), 'teacher'::public.app_role)
  AND is_active = true
  AND public.teacher_can_access_library_book(auth.uid(), books.school, books.grade_level)
);

CREATE POLICY "Students can view assigned-grade active books"
ON public.books
FOR SELECT
USING (
  public.has_role(auth.uid(), 'student'::public.app_role)
  AND is_active = true
  AND public.student_can_access_library_book(auth.uid(), books.school, books.grade_level, books.is_teacher_only)
);

CREATE POLICY "Staff can view active books in accessible schools"
ON public.books
FOR SELECT
USING (
  is_active = true
  AND (
    public.has_role(auth.uid(), 'principal'::public.app_role)
    OR public.has_role(auth.uid(), 'finance'::public.app_role)
    OR public.has_role(auth.uid(), 'it'::public.app_role)
  )
  AND (
    coalesce(nullif(btrim(books.school), ''), null) IS NULL
    OR EXISTS (
      SELECT 1
      FROM public.schools school_row
      WHERE public.book_matches_school_scope(books.school, school_row.id, school_row.code)
        AND public.user_has_school_access(auth.uid(), school_row.id)
    )
  )
);

DROP POLICY IF EXISTS "Anyone can view book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Users can view pages of books they can see" ON public.book_pages;
DROP POLICY IF EXISTS "Admins can manage book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Registrars can manage book pages" ON public.book_pages;
DROP POLICY IF EXISTS "Admins and Registrars can manage book pages" ON public.book_pages;

CREATE POLICY "Users can view pages of books they can see"
ON public.book_pages
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.books visible_book
    WHERE visible_book.id = book_pages.book_id
  )
);

CREATE POLICY "Admins and Registrars can manage book pages"
ON public.book_pages
FOR ALL
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR public.has_role(auth.uid(), 'registrar'::public.app_role)
);

DROP POLICY IF EXISTS "Anyone can view indexed pages for active books" ON public.book_page_index;
DROP POLICY IF EXISTS "Users can view indexed pages of books they can see" ON public.book_page_index;

CREATE POLICY "Users can view indexed pages of books they can see"
ON public.book_page_index
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.books visible_book
    WHERE visible_book.id = book_page_index.book_id
  )
);
