

# Create Finance User and Wire Finance Portal

## Overview
The finance role infrastructure (enum, tables, navigation, UI components) already exists. Two things are missing:
1. The finance user account (ivyann@sfxsai.com) needs to be created with proper role and school access
2. The Finance Portal component needs to be rendered when a finance user logs in (currently returns `null`)

## Changes

### 1. Create Finance User via Edge Function
Create a backend function to provision the user since we need the admin/service-role API to create auth users with a specific password.

**New file:** `supabase/functions/create-finance-user/index.ts`
- Uses service role key to create the auth user (ivyann@sfxsai.com / dargantes)
- The existing `handle_new_user` trigger will auto-create the profile and assign a default "student" role
- The function then updates `user_roles` to "finance" and inserts `user_school_access` for SFXSAI

### 2. Fix Finance Portal Rendering
**File:** `src/pages/Index.tsx`
- Change `case 'finance': return null;` to `case 'finance': return <FinancePortal onNavigate={handleTabChange} />;`
- Add import for `FinancePortal`

### 3. Add FinanceBilling Component
**New file:** `src/components/finance/FinanceBilling.tsx`
- Tabs component hosting Account Statements (StudentAssessments), Fee Setup, and Fee Templates
- Referenced in the uploaded structure doc but missing from the codebase

### 4. Wire Billing Tab in Index
**File:** `src/pages/Index.tsx`
- Add rendering for `activeTab === 'billing'` to show the new `FinanceBilling` component

## Technical Details

### Edge Function: create-finance-user
```
POST /create-finance-user
- Creates user via supabase.auth.admin.createUser()
- Updates user_roles to finance
- Grants SFXSAI school access
- Auto-confirms email (no verification needed for admin-provisioned accounts)
```

### Index.tsx Portal Fix
```tsx
case 'finance':
  return <FinancePortal onNavigate={handleTabChange} />;
```

### Execution Order
1. Deploy edge function
2. Call edge function to create the user
3. Update Index.tsx to render FinancePortal
4. Create FinanceBilling component
5. Test login with ivyann@sfxsai.com / dargantes
