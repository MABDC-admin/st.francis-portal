

## Add Password Reset to Credentials Tab and Allow IT Role Access

### Changes

#### 1. Update Role Check -- Add IT Role Access

**Files: `StudentDetailPanel.tsx`, `LISStudentDetail.tsx`, `StudentCredentialsTab.tsx`**

- Change `canViewCredentials` from `role === 'admin' || role === 'registrar'` to also include `role === 'it'`
- Update the disclaimer text in `StudentCredentialsTab` to mention IT role

#### 2. Update RLS Policy -- Allow IT Role

**New SQL migration:**

```sql
DROP POLICY IF EXISTS "Admins and registrars can view credentials" ON public.user_credentials;
CREATE POLICY "Admins registrars and IT can view credentials"
  ON public.user_credentials FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'registrar'::app_role)
    OR public.has_role(auth.uid(), 'it'::app_role)
    OR user_id = auth.uid()
  );
```

#### 3. Add Reset Password Button to `StudentCredentialsTab`

- Add a "Reset Password" button with a confirmation dialog (AlertDialog)
- Reuse the existing `create-users` edge function with `action: 'reset_student_password'`
- On success, show a toast with the new temporary password and refetch credentials
- Show loading spinner during the reset operation
- The button requires the credential to have a linked `user_id`

### Technical Details

**Reset flow** (already exists in the `create-users` edge function):
```typescript
await supabase.functions.invoke('create-users', {
  body: {
    action: 'reset_student_password',
    credentialId: credentials.id,
    userId: credentials.user_id,
  },
});
```

**Files to modify:**
- `src/components/students/StudentCredentialsTab.tsx` -- add reset button with confirmation dialog, update disclaimer
- `src/components/students/StudentDetailPanel.tsx` -- add `'it'` to role check
- `src/components/lis/LISStudentDetail.tsx` -- add `'it'` to role check
- New SQL migration for RLS policy update

