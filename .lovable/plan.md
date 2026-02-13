

# Fix: Admin Cannot See Other Users' Roles

## Problem
The `user_roles` table has a SELECT RLS policy that only allows users to view **their own** role:
```sql
qual: (auth.uid() = user_id)
```

When the admin fetches all users in Permission Management, this policy prevents them from reading other users' roles. The code then defaults unknown roles to `'student'` (line 99 of PermissionManagement.tsx), which is why Ivy Ann shows as "Student" even though her role is correctly `finance` in the database.

The role **update** works fine (admin has UPDATE policy), but the admin simply cannot **read** the updated value back.

## Solution
Add an RLS policy allowing admins to SELECT all rows in `user_roles`.

### Database Migration
```sql
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
```

This single policy addition allows admins to see every user's role while regular users can still only see their own.

## Technical Details
- **One migration file** to add the new SELECT policy
- **No code changes needed** -- the existing query in PermissionManagement.tsx already fetches from `user_roles` and builds a role map; it just needs the data to be visible
- The existing "Users can view their own roles" policy remains unchanged so non-admin users still only see their own role
- Both policies are PERMISSIVE, so they combine with OR logic -- either condition grants access

