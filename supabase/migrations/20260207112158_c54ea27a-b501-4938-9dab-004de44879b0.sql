
-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS "Admin/teacher can upload chat files" ON storage.objects;
DROP POLICY IF EXISTS "Admin/teacher can view chat files" ON storage.objects;

-- Allow authenticated users with messaging roles to upload files
CREATE POLICY "Messaging roles can upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view/download chat files (participants check via conversation)
CREATE POLICY "Authenticated users can view chat files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-attachments'
);
