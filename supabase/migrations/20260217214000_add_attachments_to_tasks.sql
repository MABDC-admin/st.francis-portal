-- Add attachments column to exam_schedules and announcements
ALTER TABLE exam_schedules ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Ensure student_assignments has it (it should, but just in case)
ALTER TABLE student_assignments ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN exam_schedules.attachments IS 'JSON array of attachment URLs and metadata';
COMMENT ON COLUMN announcements.attachments IS 'JSON array of attachment URLs and metadata';
COMMENT ON COLUMN student_assignments.attachments IS 'JSON array of attachment URLs and metadata';

-- Create storage bucket for task attachments if it doesn't exist
-- Note: Creating bucket via SQL is possible in some Supabase environments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('task-attachments', 'task-attachments', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies for task-attachments
CREATE POLICY "Allow public read access to task-attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'task-attachments');

CREATE POLICY "Allow authenticated users to upload task-attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'task-attachments');

CREATE POLICY "Allow authenticated users to delete task-attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'task-attachments');
