-- Allow registrars to manage academic years and switch the active year safely.

DROP POLICY IF EXISTS "Registrars can manage academic years" ON public.academic_years;
CREATE POLICY "Registrars can manage academic years"
ON public.academic_years
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'registrar'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'registrar'::public.app_role));

CREATE OR REPLACE FUNCTION public.set_current_academic_year(p_year_id uuid)
RETURNS public.academic_years
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year public.academic_years;
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'registrar'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'Only admins and registrars can set the active academic year'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_year
  FROM public.academic_years
  WHERE id = p_year_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academic year % does not exist', p_year_id
      USING ERRCODE = 'P0002';
  END IF;

  IF COALESCE(v_year.is_archived, false) THEN
    RAISE EXCEPTION 'Cannot set an archived academic year as active'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.academic_years
  SET is_current = false
  WHERE school_id = v_year.school_id
    AND id <> v_year.id
    AND is_current = true;

  UPDATE public.academic_years
  SET is_current = true
  WHERE id = v_year.id
  RETURNING * INTO v_year;

  RETURN v_year;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_current_academic_year(uuid) TO authenticated;
