

# Fix: RLS Policy Violation on online_registrations

## Root Cause (Confirmed)

The table `online_registrations` has three RLS policies, including one that should allow public inserts:

```
"Public can submit registrations" FOR INSERT WITH CHECK (status = 'pending')
```

The application correctly inserts with `status: 'pending'`, so the policy logic is fine.

**The real problem**: The `anon` role has **zero table-level GRANT permissions**. I confirmed this by querying `information_schema.role_table_grants` which returned empty results. Without a `GRANT INSERT`, PostgreSQL rejects the operation before RLS policies are even evaluated.

Two previous migrations attempted to add grants but they did not take effect (they were recorded in migration history but the actual permissions were never applied).

## Fix

Run a new migration with the grants. This time we will also verify the grants took effect.

```sql
-- Grant permissions for the public registration form (anon role)
GRANT SELECT, INSERT ON public.online_registrations TO anon;

-- Grant permissions for authenticated users (admin/registrar dashboard)  
GRANT SELECT, INSERT, UPDATE, DELETE ON public.online_registrations TO authenticated;
```

No code changes are needed -- the form already inserts with `status: 'pending'` which satisfies the existing RLS policy.

## Verification

After the migration, I will query `information_schema.role_table_grants` to confirm the grants actually applied this time.

## Files

| Action | File |
|--------|------|
| Migration | Grant `anon` and `authenticated` permissions on `online_registrations` |

No frontend changes required.
