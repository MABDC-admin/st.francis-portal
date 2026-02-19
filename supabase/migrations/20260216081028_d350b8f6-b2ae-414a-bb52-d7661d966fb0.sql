
-- Add storage INSERT policy for authenticated users on teacher-applications bucket
CREATE POLICY "Allow authenticated upload to teacher-applications"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'teacher-applications');

-- Re-attach the reference number trigger
CREATE TRIGGER set_teacher_application_ref
  BEFORE INSERT ON public.teacher_applications
  FOR EACH ROW
  WHEN (NEW.reference_number IS NULL)
  EXECUTE FUNCTION generate_teacher_application_ref();
