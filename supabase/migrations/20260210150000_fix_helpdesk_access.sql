-- FIX: Helpdesk visibility and permission issues

-- 1. Ensure app_role enum has all required roles
-- Note: 'IF NOT EXISTS' for enum values requires a DO block in some Postgres versions or safe handling
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'finance') THEN
        ALTER TYPE public.app_role ADD VALUE 'finance';
    END IF;
END $$;

-- 2. Modify helpdesk_tickets to reference profiles instead of auth.users
-- This allows PostgREST to perform joins for creator/assignee info
ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_created_by_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id);

ALTER TABLE public.helpdesk_tickets DROP CONSTRAINT IF EXISTS helpdesk_tickets_assigned_to_fkey;
ALTER TABLE public.helpdesk_tickets ADD CONSTRAINT helpdesk_tickets_assigned_to_fkey 
    FOREIGN KEY (assigned_to) REFERENCES public.profiles(id);

-- 3. Update RLS policies for helpdesk_tickets
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Admins can update all tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.helpdesk_tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.helpdesk_tickets;

-- Staffs (Admin/Registrar) can view all tickets
CREATE POLICY "Staffs can view all tickets"
ON public.helpdesk_tickets
FOR SELECT
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'registrar')
);

-- Staffs can update all tickets
CREATE POLICY "Staffs can update all tickets"
ON public.helpdesk_tickets
FOR UPDATE
USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'registrar')
);

-- Users can view tickets they are part of
CREATE POLICY "Users can view their own tickets"
ON public.helpdesk_tickets
FOR SELECT
USING (
    (auth.uid())::uuid = created_by OR 
    (auth.uid())::uuid = assigned_to
);

-- Anyone can create a ticket
CREATE POLICY "Users can create tickets"
ON public.helpdesk_tickets
FOR INSERT
WITH CHECK (
    (auth.uid())::uuid = created_by
);

-- Creators can update status (e.g., closing)
CREATE POLICY "Users can update their own tickets"
ON public.helpdesk_tickets
FOR UPDATE
USING (
    (auth.uid())::uuid = created_by
);

-- 4. Fix comments policies
DROP POLICY IF EXISTS "Users can view comments on their tickets" ON public.helpdesk_comments;
DROP POLICY IF EXISTS "Users can create comments on their tickets" ON public.helpdesk_comments;

CREATE POLICY "Users can view comments on accessible tickets"
ON public.helpdesk_comments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.helpdesk_tickets
        WHERE id = helpdesk_comments.ticket_id
        AND (
            created_by = (auth.uid())::uuid OR
            assigned_to = (auth.uid())::uuid OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'registrar')
        )
    )
);

CREATE POLICY "Users can create comments on accessible tickets"
ON public.helpdesk_comments
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.helpdesk_tickets
        WHERE id = helpdesk_comments.ticket_id
        AND (
            created_by = (auth.uid())::uuid OR
            assigned_to = (auth.uid())::uuid OR
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'registrar')
        )
    )
);

-- 5. Fix attachments policies
DROP POLICY IF EXISTS "Users can view attachments" ON public.helpdesk_attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON public.helpdesk_attachments;

CREATE POLICY "Users can view attachments on accessible tickets"
ON public.helpdesk_attachments
FOR SELECT
USING (
    (ticket_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.helpdesk_tickets
        WHERE id = helpdesk_attachments.ticket_id
        AND (
            created_by = (auth.uid())::uuid OR 
            assigned_to = (auth.uid())::uuid OR 
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'registrar')
        )
    )) OR
    (comment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.helpdesk_comments
        JOIN public.helpdesk_tickets ON helpdesk_comments.ticket_id = helpdesk_tickets.id
        WHERE helpdesk_comments.id = helpdesk_attachments.comment_id
        AND (
            helpdesk_tickets.created_by = (auth.uid())::uuid OR 
            helpdesk_tickets.assigned_to = (auth.uid())::uuid OR 
            public.has_role(auth.uid(), 'admin') OR
            public.has_role(auth.uid(), 'registrar')
        )
    ))
);

CREATE POLICY "Users can upload attachments on accessible tickets"
ON public.helpdesk_attachments
FOR INSERT
WITH CHECK (
    (auth.uid())::uuid = uploader_id AND 
    (
        (ticket_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.helpdesk_tickets 
            WHERE id = ticket_id AND (
                created_by = (auth.uid())::uuid OR 
                assigned_to = (auth.uid())::uuid OR 
                public.has_role(auth.uid(), 'admin') OR
                public.has_role(auth.uid(), 'registrar')
            )
        )) OR
        (comment_id IS NOT NULL AND EXISTS (
             SELECT 1 FROM public.helpdesk_comments
             JOIN public.helpdesk_tickets ON helpdesk_comments.ticket_id = helpdesk_tickets.id
             WHERE helpdesk_comments.id = comment_id
             AND (
                 helpdesk_tickets.created_by = (auth.uid())::uuid OR 
                 helpdesk_tickets.assigned_to = (auth.uid())::uuid OR 
                 public.has_role(auth.uid(), 'admin') OR
                 public.has_role(auth.uid(), 'registrar')
             )
        ))
    )
);
