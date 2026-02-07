
-- 1. Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'private' CHECK (type IN ('private', 'group')),
  name text,
  created_by uuid NOT NULL,
  school_id uuid REFERENCES public.schools(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. Conversation participants
CREATE TABLE public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  last_read_at timestamptz DEFAULT now(),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;

-- 3. Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system')),
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 4. Message receipts
CREATE TABLE public.message_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'delivered' CHECK (status IN ('delivered', 'seen')),
  status_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;

-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;

-- RLS for conversations: participants can view their conversations
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversations.id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/teacher can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Creator can update conversation"
  ON public.conversations FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creator can delete conversation"
  ON public.conversations FOR DELETE
  USING (created_by = auth.uid());

-- RLS for conversation_participants
CREATE POLICY "Participants can view co-participants"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp2
      WHERE cp2.conversation_id = conversation_participants.conversation_id AND cp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin/teacher can add participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)
  );

CREATE POLICY "Users can update their own participation"
  ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Conversation creator can remove participants"
  ON public.conversation_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_participants.conversation_id AND c.created_by = auth.uid()
    )
  );

-- RLS for messages
CREATE POLICY "Participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Sender can update own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Sender can delete own messages"
  ON public.messages FOR DELETE
  USING (sender_id = auth.uid());

-- RLS for message_receipts
CREATE POLICY "Participants can view receipts"
  ON public.message_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      JOIN public.conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_receipts.message_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert receipts"
  ON public.message_receipts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Users can update their own receipts"
  ON public.message_receipts FOR UPDATE
  USING (user_id = auth.uid());

-- Storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

CREATE POLICY "Admin/teacher can upload chat files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

CREATE POLICY "Admin/teacher can view chat files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments' AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  );

-- Updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Updated_at trigger for messages
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
