
-- Step 1: Drop the buggy INSERT policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;

-- Step 2: Update conversations SELECT policy to include creators
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);
