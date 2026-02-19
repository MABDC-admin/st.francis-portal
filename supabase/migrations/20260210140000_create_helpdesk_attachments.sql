-- Create Helpdesk Attachments Table
CREATE TABLE IF NOT EXISTS public.helpdesk_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.helpdesk_comments(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    content_type TEXT NOT NULL,
    uploader_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT ticket_or_comment_check CHECK (
        (ticket_id IS NOT NULL AND comment_id IS NULL) OR 
        (ticket_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- Enable RLS
ALTER TABLE public.helpdesk_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view attachments if they can view the related ticket/comment
CREATE POLICY "Users can view attachments"
ON public.helpdesk_attachments
FOR SELECT
USING (
    (ticket_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.helpdesk_tickets
        WHERE id = helpdesk_attachments.ticket_id
        AND (created_by = auth.uid() OR assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    )) OR
    (comment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.helpdesk_comments
        JOIN public.helpdesk_tickets ON helpdesk_comments.ticket_id = helpdesk_tickets.id
        WHERE helpdesk_comments.id = helpdesk_attachments.comment_id
        AND (helpdesk_tickets.created_by = auth.uid() OR helpdesk_tickets.assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
    ))
);

-- Users can upload attachments to their own tickets or comments
CREATE POLICY "Users can upload attachments"
ON public.helpdesk_attachments
FOR INSERT
WITH CHECK (
    auth.uid() = uploader_id AND (
        (ticket_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.helpdesk_tickets WHERE id = ticket_id AND (created_by = auth.uid() OR assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
        )) OR
        (comment_id IS NOT NULL AND EXISTS (
             SELECT 1 FROM public.helpdesk_comments
             JOIN public.helpdesk_tickets ON helpdesk_comments.ticket_id = helpdesk_tickets.id
             WHERE helpdesk_comments.id = comment_id
             AND (helpdesk_tickets.created_by = auth.uid() OR helpdesk_tickets.assigned_to = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
        ))
    )
);

-- Storage bucket policies (Assuming 'helpdesk-files' bucket exists or will be created)
-- Note: Bucket creation usually happens in the dashboard or via a separate API call, but policies are SQL.

-- We'll just define the policies here assuming the bucket name 'helpdesk-files'

-- Policy for viewing files (Authenticated users who can view the ticket)
-- This is tricky in simple SQL without complex joins back to tables, usually storage policies are broader or use specific folder structures
-- For simplicity, we'll allow authenticated users to read from the bucket, relying on the application to only show links to permitted files.
-- A stricter policy would involve a function checking permissions.

-- INSERT INTO storage.buckets (id, name, public) VALUES ('helpdesk-files', 'helpdesk-files', false) ON CONFLICT DO NOTHING;

-- CREATE POLICY "Give authenticated users access to helpdesk files"
-- ON storage.objects FOR SELECT
-- TO authenticated
-- USING ( bucket_id = 'helpdesk-files' );

-- CREATE POLICY "Allow authenticated users to upload helpdesk files"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK ( bucket_id = 'helpdesk-files' );
