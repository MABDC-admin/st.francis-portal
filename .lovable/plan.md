

# Fix: Two Root Causes for "Failed to create conversation"

## Problem 1: Infinite Recursion (Still Present)
The `conversation_participants` table has a second INSERT policy called **"Users can add participants"** containing this buggy clause:

```sql
NOT EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = cp.conversation_id  -- BUG: self-comparison, always true
)
```

Even though there's a working INSERT policy ("Authorized roles can add participants"), Postgres evaluates ALL policies (OR'd together), so the buggy one still triggers recursion.

## Problem 2: Conversation INSERT Returns No Data
The code does `.insert().select().single()` on `conversations`. The SELECT policy requires `id IN (SELECT get_user_conversation_ids(auth.uid()))`, but at the moment of insert the user has **no participant row yet**, so the SELECT returns nothing -- making it look like the insert failed with "new row violates row-level security."

## Fix (Single Database Migration)

### Step 1: Drop the buggy INSERT policy
```sql
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
```

### Step 2: Update conversations SELECT policy to include creators
```sql
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);
```

This allows the conversation creator to immediately see their newly created conversation row before participant records are inserted.

### No Frontend Code Changes Needed
All application code remains unchanged.

