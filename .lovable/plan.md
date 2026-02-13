

# Fix: rene@sfxsai.com Not Showing in User Roles

## Problem

The user `rene@sfxsai.com` exists in the authentication system and in the `user_credentials` table (with role `registrar`), but is **missing from two critical tables**:

- **profiles** table -- no row exists
- **user_roles** table -- no row exists

The `handle_new_user` database trigger (which normally creates both records automatically when an account is created) appears to have failed silently for this account.

Since the Permission Management UI fetches its user list from the `profiles` table, `rene@sfxsai.com` is invisible in the admin interface.

## Solution

Run a single database migration to backfill the missing records for this user.

### Database Migration

```sql
-- Backfill missing profile for rene@sfxsai.com
INSERT INTO public.profiles (id, email, full_name)
VALUES ('7d022361-e814-4d03-ae8d-3c0f58e2c56c', 'rene@sfxsai.com', 'Rene')
ON CONFLICT (id) DO NOTHING;

-- Backfill missing role for rene@sfxsai.com (registrar per user_credentials)
INSERT INTO public.user_roles (user_id, role)
VALUES ('7d022361-e814-4d03-ae8d-3c0f58e2c56c', 'registrar')
ON CONFLICT (user_id, role) DO NOTHING;

-- Also backfill any other auth users missing from profiles
INSERT INTO public.profiles (id, email, full_name)
SELECT u.id, u.email, COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Also backfill any other auth users missing from user_roles (default to student)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'student'::app_role
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.user_id IS NULL
  AND u.id != '7d022361-e814-4d03-ae8d-3c0f58e2c56c'  -- already handled above as registrar
ON CONFLICT (user_id, role) DO NOTHING;
```

This migration:
1. Creates the missing profile and role records for `rene@sfxsai.com` specifically (with the correct `registrar` role from `user_credentials`)
2. Catches any other auth users that might also be missing from profiles/user_roles as a safety net
3. Uses `ON CONFLICT DO NOTHING` to be safe if re-run

### No Code Changes Needed

The existing UI code in `PermissionManagement.tsx` already queries `profiles` and `user_roles` correctly. Once the data exists, `rene@sfxsai.com` will appear with the `Registrar` role badge.

