-- Enable the storage extension if not already enabled (usually defaults on)
-- Create the bucket 'teacher-applications' if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-applications', 'teacher-applications', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow Anonymous Users to Upload (INSERT)
-- This is necessary for public applicants to submit their photos and docs.
DROP POLICY IF EXISTS "Allow anon uploads" ON storage.objects;
CREATE POLICY "Allow anon uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'teacher-applications');

-- Policy: Allow Public/Anon to SELECT (View) files? 
-- NO. Use Signed URLs for Admins.
-- However, if you want the applicant to verify their upload by downloading it immediately,
-- we'd need a way to identify them. Since they are anon, we can't.
-- We rely on client-side state for "verification" (showing the filename).

-- Policy: Allow Authenticated Users (Admins/Staff) to SELECT/VIEW
DROP POLICY IF EXISTS "Allow authenticated view" ON storage.objects;
CREATE POLICY "Allow authenticated view"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'teacher-applications');

-- Policy: Allow Authenticated Users (Admins) to DELETE/UPDATE?
-- Maybe mainly for cleanup.
CREATE POLICY "Allow authenticated maintenance"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'teacher-applications');
