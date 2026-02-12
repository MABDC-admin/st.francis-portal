

# Fix: RLS Error on online_registrations + React Ref Warnings

## Root Cause (Finally Found)

The table-level GRANTs are working correctly. The real problem is the **INSERT + SELECT chain**:

```typescript
await supabase.from('online_registrations')
  .insert([{...}])
  .select('id')   // <-- THIS requires a SELECT RLS policy
  .single();
```

The existing RLS policies:
- **"Public can submit registrations"** -- INSERT only, WITH CHECK `status = 'pending'` (works fine)
- **"Admin can manage"** -- ALL, USING `has_role(auth.uid(), 'admin')` (anon fails)
- **"Registrar can manage"** -- ALL, USING `has_role(auth.uid(), 'registrar')` (anon fails)

The `anon` role has NO SELECT policy, so the `.select('id')` after the insert fails with a 401 error.

## Fix 1: Remove `.select('id').single()` from insert

The simplest and most secure fix. The `lastRegistrationId` is only used for the SchoolShowcaseDialog's optional `registrationId` prop. We can remove the select chain and set `lastRegistrationId` to null.

**Before:**
```typescript
const { data: insertedData, error } = await supabase
  .from('online_registrations')
  .insert([{...}])
  .select('id').single();
```

**After:**
```typescript
const { error } = await supabase
  .from('online_registrations')
  .insert([{...}]);
```

This avoids the need for a SELECT policy for `anon`, which would be a security concern (exposing all registration records to unauthenticated users).

## Fix 2: React Ref Warnings

The `FieldError` and `ReviewRow` components are defined inside the render function and receive refs from `framer-motion`. Fix by moving them outside the component as standalone functions (not components that receive refs).

**Current (inside component body, line 210 and 219):**
```typescript
const FieldError = ({ field }) => errors[field] ? <p>...</p> : null;
const ReviewRow = ({ label, value }) => (<div>...</div>);
```

**Fix:** Convert `FieldError` to a simple inline expression or move both components outside the parent component with proper `React.forwardRef` wrapping. The simplest fix is to replace `FieldError` usages with inline JSX and move `ReviewRow` outside.

## Files to Modify

| Action | File |
|--------|------|
| Modify | `src/components/registration/OnlineRegistrationForm.tsx` |

No database changes needed -- the GRANTs are already in place and working.

