

# Fix: "Failed to create conversation" - Infinite Recursion in RLS

## Root Cause
The `conversation_participants` table has a broken RLS SELECT policy called **"Users can view their participations"** with this expression:

```sql
EXISTS (
  SELECT 1 FROM conversation_participants cp
  WHERE cp.conversation_id = cp.conversation_id  -- BUG: self-join, not comparing to the row
    AND cp.user_id = auth.uid()
)
```

The `cp.conversation_id = cp.conversation_id` compares the subquery alias to itself (always true), which triggers infinite recursion when Postgres tries to evaluate RLS on the subquery's own table.

There is already a correct duplicate policy **"Participants can view co-participants"** that does this properly using `cp2.conversation_id = conversation_participants.conversation_id`.

## Fix

**Single database migration** to drop the broken policy:

```sql
DROP POLICY IF EXISTS "Users can view their participations" ON public.conversation_participants;
```

No code changes needed -- only this one policy fix.
