
-- Drop and recreate RLS policies to include registrar role

-- conversations policies
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admin/teacher can create conversations" ON public.conversations;

CREATE POLICY "Participants can view conversations" ON public.conversations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = id AND user_id = auth.uid()
  )
);

CREATE POLICY "Admin/teacher/registrar can create conversations" ON public.conversations
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'registrar')
);

-- conversation_participants policies
DROP POLICY IF EXISTS "Users can view their participations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can update their own participation" ON public.conversation_participants;

CREATE POLICY "Users can view their participations" ON public.conversation_participants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
  )
);

CREATE POLICY "Authorized roles can add participants" ON public.conversation_participants
FOR INSERT WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR
  public.has_role(auth.uid(), 'teacher') OR
  public.has_role(auth.uid(), 'registrar')
);

CREATE POLICY "Users can update their own participation" ON public.conversation_participants
FOR UPDATE USING (user_id = auth.uid());

-- messages policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;

CREATE POLICY "Participants can view messages" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Participants can insert messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
  )
);

-- message_receipts policies
DROP POLICY IF EXISTS "Users can view receipts for their messages" ON public.message_receipts;
DROP POLICY IF EXISTS "Users can insert their own receipts" ON public.message_receipts;
DROP POLICY IF EXISTS "Users can update their own receipts" ON public.message_receipts;

CREATE POLICY "Users can view receipts for their messages" ON public.message_receipts
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_id AND m.sender_id = auth.uid()
  )
);

CREATE POLICY "Users can insert their own receipts" ON public.message_receipts
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own receipts" ON public.message_receipts
FOR UPDATE USING (user_id = auth.uid());
