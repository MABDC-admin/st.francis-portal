-- Add DELETE policies for helpdesk_tickets
CREATE POLICY "Users can delete their own tickets"
  ON public.helpdesk_tickets FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Admins can delete any ticket"
  ON public.helpdesk_tickets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policies for helpdesk_comments
CREATE POLICY "Users can delete their own comments"
  ON public.helpdesk_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any comment"
  ON public.helpdesk_comments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Add DELETE policies for helpdesk_attachments
CREATE POLICY "Users can delete their own attachments"
  ON public.helpdesk_attachments FOR DELETE
  USING (auth.uid() = uploader_id);

CREATE POLICY "Admins can delete any attachment"
  ON public.helpdesk_attachments FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));
