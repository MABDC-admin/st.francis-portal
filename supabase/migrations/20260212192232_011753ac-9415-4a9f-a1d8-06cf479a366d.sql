
-- Function to enforce writes only on current academic year
CREATE OR REPLACE FUNCTION public.enforce_current_academic_year()
RETURNS TRIGGER AS $$
DECLARE
  year_record RECORD;
  bypass TEXT;
BEGIN
  -- Allow bypass for admin operations (promotion, archiving)
  bypass := current_setting('app.bypass_year_lock', true);
  IF bypass = 'true' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  -- For DELETE, check OLD record
  IF TG_OP = 'DELETE' THEN
    SELECT is_current, is_archived INTO year_record
    FROM public.academic_years WHERE id = OLD.academic_year_id;
  ELSE
    SELECT is_current, is_archived INTO year_record
    FROM public.academic_years WHERE id = NEW.academic_year_id;
  END IF;

  -- If year not found, allow (safety)
  IF NOT FOUND THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF year_record.is_archived = true THEN
    RAISE EXCEPTION 'Cannot modify records: academic year is archived and locked';
  END IF;

  IF year_record.is_current IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Cannot modify records: academic year is not the current active year';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach trigger to all tables with academic_year_id
CREATE TRIGGER enforce_year_lock_students
  BEFORE INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_student_grades
  BEFORE INSERT OR UPDATE OR DELETE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_student_attendance
  BEFORE INSERT OR UPDATE OR DELETE ON public.student_attendance
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_raw_scores
  BEFORE INSERT OR UPDATE OR DELETE ON public.raw_scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_student_subjects
  BEFORE INSERT OR UPDATE OR DELETE ON public.student_subjects
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_student_assessments
  BEFORE INSERT OR UPDATE OR DELETE ON public.student_assessments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_student_assignments
  BEFORE INSERT OR UPDATE OR DELETE ON public.student_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_payments
  BEFORE INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_admissions
  BEFORE INSERT OR UPDATE OR DELETE ON public.admissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_class_schedules
  BEFORE INSERT OR UPDATE OR DELETE ON public.class_schedules
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_exam_schedules
  BEFORE INSERT OR UPDATE OR DELETE ON public.exam_schedules
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_announcements
  BEFORE INSERT OR UPDATE OR DELETE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();

CREATE TRIGGER enforce_year_lock_finance_clearance
  BEFORE INSERT OR UPDATE OR DELETE ON public.finance_clearance
  FOR EACH ROW EXECUTE FUNCTION public.enforce_current_academic_year();
