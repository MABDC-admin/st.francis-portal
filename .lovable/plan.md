

# Fix Finance User Login - Password Reset

## Problem
The user `ivyann@sfxsai.com` was created on Feb 11 (before the edge function ran on Feb 13). The edge function successfully assigned the `finance` role but could NOT update the password because the user already existed. The login fails because the stored password doesn't match `dargantes`.

## Solution
Update the existing `create-finance-user` edge function to also handle updating the password for an existing user using `supabase.auth.admin.updateUserById()`. Then re-invoke it.

### File: `supabase/functions/create-finance-user/index.ts`
Add logic after the "user already exists" path:
```typescript
// If user already exists, update their password
const { error: updateError } = await supabase.auth.admin.updateUserById(existingUserId, {
  password: 'dargantes',
});
```

### Execution Steps
1. Update the edge function to include password reset logic
2. Deploy the updated function
3. Call the function to reset the password
4. Verify login works with ivyann@sfxsai.com / dargantes

