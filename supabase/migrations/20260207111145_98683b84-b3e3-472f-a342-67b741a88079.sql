
-- Step 1: Create SECURITY DEFINER helper function
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT conversation_id 
  FROM conversation_participants 
  WHERE user_id = _user_id;
$$;

-- Step 2: Drop all problematic/duplicate policies
DROP POLICY IF EXISTS "Participants can view co-participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Admin/teacher can add participants" ON public.conversation_participants;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;

DROP POLICY IF EXISTS "Participants can view receipts" ON public.message_receipts;

-- Step 3: Recreate clean policies

-- conversation_participants SELECT
CREATE POLICY "Users can view conversation participants"
ON public.conversation_participants FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- conversation_participants INSERT
CREATE POLICY "Users can add participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
  conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
  OR NOT EXISTS (SELECT 1 FROM public.conversation_participants WHERE conversation_id = conversation_participants.conversation_id)
);

-- conversations SELECT
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
TO authenticated
USING (id IN (SELECT public.get_user_conversation_ids(auth.uid())));

-- messages SELECT
CREATE POLICY "Users can view messages"
ON public.messages FOR SELECT
TO authenticated
USING (conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid())));

-- messages INSERT (single clean policy)
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);

-- message_receipts SELECT
CREATE POLICY "Users can view message receipts"
ON public.message_receipts FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_receipts.message_id
    AND m.sender_id = auth.uid()
  )
);
