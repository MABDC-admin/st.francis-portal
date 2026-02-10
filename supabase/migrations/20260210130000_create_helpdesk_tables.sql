-- Create Helpdesk Tickets Table
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('hardware', 'software', 'network', 'access', 'other')),
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Helpdesk Comments Table
CREATE TABLE IF NOT EXISTS public.helpdesk_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.helpdesk_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for helpdesk_tickets

-- Admins can view all tickets
CREATE POLICY "Admins can view all tickets"
ON public.helpdesk_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update all tickets
CREATE POLICY "Admins can update all tickets"
ON public.helpdesk_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets"
ON public.helpdesk_tickets
FOR SELECT
USING (
  auth.uid() = created_by OR auth.uid() = assigned_to
);

-- Users can create tickets
CREATE POLICY "Users can create tickets"
ON public.helpdesk_tickets
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Users can update their own tickets (e.g. close them)
CREATE POLICY "Users can update their own tickets"
ON public.helpdesk_tickets
FOR UPDATE
USING (
  auth.uid() = created_by
);


-- RLS Policies for helpdesk_comments

-- Users can view comments on tickets they have access to
CREATE POLICY "Users can view comments on their tickets"
ON public.helpdesk_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.helpdesk_tickets
    WHERE id = helpdesk_comments.ticket_id
    AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
);

-- Users can create comments on tickets they have access to
CREATE POLICY "Users can create comments on their tickets"
ON public.helpdesk_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.helpdesk_tickets
    WHERE id = helpdesk_comments.ticket_id
    AND (
      created_by = auth.uid() OR
      assigned_to = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  )
);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_helpdesk_tickets_updated_at
    BEFORE UPDATE ON public.helpdesk_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
