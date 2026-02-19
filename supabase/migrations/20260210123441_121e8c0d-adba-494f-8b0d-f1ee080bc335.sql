
ALTER TABLE public.helpdesk_tickets ADD COLUMN pc_name text DEFAULT NULL;

INSERT INTO storage.buckets (id, name, public)
VALUES ('helpdesk-files', 'helpdesk-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload helpdesk files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'helpdesk-files');

CREATE POLICY "Authenticated users can read helpdesk files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'helpdesk-files');
