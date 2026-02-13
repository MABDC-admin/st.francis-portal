

# Ensure rogelio@sfxsai.com in User Roles and Enforce Account Creation

## Part 1: Add rogelio@sfxsai.com to User Roles

The principal account for `rogelio@sfxsai.com` does not yet exist in the `profiles` or `user_roles` tables. We will create this account using the existing `create-users` edge function with the `create_admin` action pattern, but adapted for the `principal` role.

**Approach**: Add a new action `create_principal` to the `create-users` edge function (or reuse existing role-creation logic), then run a database migration to backfill the profile and role entries.

**Database Migration:**
- Insert profile record for `rogelio@sfxsai.com` using the service role
- Insert `principal` role into `user_roles`
- Insert into `user_credentials` for admin management visibility
- Create the auth user via the edge function call (since migrations cannot create auth users directly, we will call the edge function after deployment)

Since the edge function already supports `create_registrar`, `create_teacher`, `create_finance`, we will add `create_principal` support.

---

## Part 2: Auto-Create Accounts on Admission Approval

Currently, when an admission is approved in `AdmissionsPage.tsx`, a student record is created but NO user account is generated. The enrollment form already handles this, but admission approval does not.

**File: `src/components/admissions/AdmissionsPage.tsx`**
- After the student record is successfully inserted (line ~121), add the same account creation logic used in the enrollment flow
- Call `create-users` edge function with `create_single_student` action
- Show the generated credentials in the approval success message
- Log the account creation in the audit trail

---

## Part 3: Add Finance Role to Permission Management UI

**File: `src/components/admin/PermissionManagement.tsx`**
- Add `finance` to `roleColors` and `roleDescriptions` maps (currently missing)

---

## Part 4: Update create-users Edge Function

**File: `supabase/functions/create-users/index.ts`**
- Add `create_principal` to the action type union and role map
- This allows creating principal accounts through the same edge function used for other staff roles

---

## Technical Summary

| Change | File | Description |
|--------|------|-------------|
| Database migration | SQL migration | Backfill rogelio@sfxsai.com into profiles, user_roles, user_credentials |
| Edge function update | `supabase/functions/create-users/index.ts` | Add `create_principal` action support |
| Admission auto-account | `src/components/admissions/AdmissionsPage.tsx` | Create student user account on approval |
| UI fix | `src/components/admin/PermissionManagement.tsx` | Add finance role color and description |

### Admission Approval Flow (Updated)

```text
Approve clicked
  -> Update admission status to "approved"
  -> Insert student record into students table
  -> Call create-users edge function (create_single_student)
  -> Store credentials and show to admin
  -> Send email notification
  -> Log to admission_audit_logs
```

### Database Migration Details

```text
-- Create auth user for rogelio@sfxsai.com (done via edge function call)
-- Then backfill:
INSERT INTO profiles (id, email, full_name) VALUES (<auth_user_id>, 'rogelio@sfxsai.com', 'Rogelio Torrente');
INSERT INTO user_roles (user_id, role) VALUES (<auth_user_id>, 'principal');
INSERT INTO user_credentials (user_id, email, temp_password, role) VALUES (<auth_user_id>, 'rogelio@sfxsai.com', 'torrente', 'principal');
```

Since we cannot create auth users in SQL migrations, the implementation will:
1. Call the `create-users` edge function with `create_principal` action to create the auth user
2. The edge function handles profile, role, and credentials insertion automatically via the existing `handle_new_user` trigger

