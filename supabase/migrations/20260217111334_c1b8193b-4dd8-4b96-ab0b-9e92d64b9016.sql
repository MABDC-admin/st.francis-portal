
-- Clean up duplicate anonymous INSERT policy
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;

-- Add UPDATE policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated update teacher-applications'
  ) THEN
    CREATE POLICY "Allow authenticated update teacher-applications"
    ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'teacher-applications');
  END IF;
END $$;

-- Ensure DELETE policy exists
DROP POLICY IF EXISTS "Allow authenticated maintenance" ON storage.objects;
CREATE POLICY "Allow authenticated maintenance"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'teacher-applications');
