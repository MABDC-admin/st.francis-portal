

# Add IT Role with User Account and Dedicated Portal

## Overview
Create a new "it" role in the system, set up the user account for `ivann@sfxsai.com` (password: `danieles`), build a dedicated IT portal with system management tools, and configure RLS policies to grant IT users full profile visibility.

---

## 1. Database Changes

**Extend the `app_role` enum:**
```text
ALTER TYPE public.app_role ADD VALUE 'it';
```

**RLS policy for IT role on profiles:**
- Add a new SELECT policy on `profiles` allowing users with the `it` role to view all profiles (using the existing `has_role()` security definer function)

**RLS policy for IT role on user_roles:**
- Add SELECT policy so IT users can view all user roles (needed for the management UI)

---

## 2. Create IT User Account

Using the `create-users` edge function:
- Add `create_it` action to the edge function's action union and role map
- Call it to create `ivann@sfxsai.com` with password `danieles`
- This auto-creates profile, user_roles (as 'it'), and user_credentials entries

---

## 3. Update Role References Across the App

**`src/contexts/AuthContext.tsx`** - Add `'it'` to the `AppRole` type union

**`src/components/admin/PermissionManagement.tsx`** - Add `it` to `roleColors` and `roleDescriptions`

**`src/components/admin/RoleAssignmentDialog.tsx`** - Add `'it'` to the roles array and roleColors map

---

## 4. IT Portal

**New file: `src/components/portals/ITPortal.tsx`**
- Dashboard with IT-focused cards:
  - Total Users count
  - Active Sessions overview
  - System Health status
  - Storage usage
- Quick action cards: User Management, Audit Logs, System Monitoring, Profile Management
- Links to relevant tabs (user permissions, helpdesk, integrations)

**`src/components/portals/index.ts`** - Export the new ITPortal

---

## 5. Navigation for IT Role

**`src/components/layout/DashboardLayout.tsx`**
- Add `case 'it'` to `getNavGroupsForRole()` with sidebar items:
  - Portal Home
  - User Management (Permissions, Credentials, Audit Logs)
  - System Tools (Integrations: NocoDB, Omada, Tactical RMM, Documize, Excalidraw)
  - Resources (Library, AI Chat)
  - My Profile
  - Helpdesk

---

## 6. Portal Rendering

**`src/pages/Index.tsx`**
- Import ITPortal
- Add `case 'it'` to `renderPortal()` returning `<ITPortal />`
- Grant IT role access to: admin panel, permissions, helpdesk, integrations, library, profile, and all user management tabs

---

## 7. Edge Function Update

**`supabase/functions/create-users/index.ts`**
- Add `"create_it"` to the action type union
- Add `create_it: "it"` to the roleMap

---

## Technical Summary

| Change | File | Description |
|--------|------|-------------|
| DB migration | SQL | Add 'it' to app_role enum, RLS policies for profile/role visibility |
| Edge function | `supabase/functions/create-users/index.ts` | Add `create_it` action |
| Auth context | `src/contexts/AuthContext.tsx` | Add 'it' to AppRole type |
| IT Portal | `src/components/portals/ITPortal.tsx` (new) | IT dashboard with system management cards |
| Portal export | `src/components/portals/index.ts` | Export ITPortal |
| Navigation | `src/components/layout/DashboardLayout.tsx` | Add IT role nav groups |
| Rendering | `src/pages/Index.tsx` | Add IT portal rendering and tab access |
| Permission UI | `src/components/admin/PermissionManagement.tsx` | Add IT role color/description |
| Role dialog | `src/components/admin/RoleAssignmentDialog.tsx` | Add 'it' to assignable roles |

