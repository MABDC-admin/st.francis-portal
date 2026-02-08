

# Impersonate Page Implementation

## Overview

Add a new "Impersonate" page/section accessible to all roles, positioned below the Integrations group in the admin sidebar navigation (and at the bottom of other role navs). Admins can use it to impersonate other users; non-admin roles see a read-only view explaining the feature.

## What Will Be Built

### 1. New Component: `src/components/admin/ImpersonatePage.tsx`

A full-page component that provides:

- **For Admins**: A searchable user list (fetched from `profiles` + `user_roles` tables) with an "Impersonate" button next to each user. Clicking it stores the admin's original session info in `sessionStorage`, then signs in as the target user. A persistent banner at the top indicates impersonation is active with a "Stop Impersonating" button to restore the original admin session.
- **For Non-Admin Roles**: A read-only informational card explaining that impersonation is an admin-only action, with their current session details displayed.

### 2. Navigation Updates in `DashboardLayout.tsx`

- Add `'impersonate'` nav item to every role's navigation in `getNavGroupsForRole()`, placed after the Integrations group (admin), or at the bottom of the nav list (other roles).
- Add icon mappings for `'impersonate'` in both `icon3DMap` and `iconAppleMap`.

### 3. Route/Tab Handling in `Index.tsx`

- Import the new `ImpersonatePage` component.
- Add a tab render block: `{activeTab === 'impersonate' && <ImpersonatePage />}` -- accessible to all authenticated users (no role restriction).

### 4. Impersonation Logic

The impersonation mechanism will work as follows:
- Admin clicks "Impersonate" on a target user.
- The system stores the admin's current session token in `sessionStorage` under `impersonating_admin_session`.
- The system uses the `create-users` edge function (or a new lightweight edge function) to generate a temporary sign-in link for the target user.
- Upon "Stop Impersonating", the stored admin session is restored and `sessionStorage` is cleared.

**Important security note**: Since we cannot generate arbitrary sign-in tokens client-side, the implementation will use a simpler approach -- storing the admin's identity and switching the UI context (role + displayed data) without actually switching the authentication session. This avoids security risks while still allowing admins to "see as" another user.

## Technical Details

### Files to Create
- `src/components/admin/ImpersonatePage.tsx` -- Main impersonate UI component

### Files to Modify
- `src/components/layout/DashboardLayout.tsx` -- Add nav item for all roles, add icon mappings
- `src/pages/Index.tsx` -- Add tab rendering for `'impersonate'`

### Component Structure

```text
ImpersonatePage
+-- Header (title + description)
+-- [Admin View]
|   +-- Search input to filter users
|   +-- User list table (name, email, role, school)
|   +-- "Impersonate" button per row
|   +-- Active impersonation banner (when impersonating)
+-- [Non-Admin View]
    +-- Info card explaining the feature
    +-- Current user session details
```

### Navigation Placement

For the admin role, the item will appear after the Integrations collapsible group and before any other bottom items. For all other roles, it will appear at the end of their navigation list. The nav item will use the `AdminIcon3D` / `AppleAdminIcon` icon with the label "Impersonate".
