
# Comprehensive Admin Dashboard Enhancement Plan

## Overview
This plan implements four key features:
1. Add school logo next to school name in dashboard header
2. Remove "MABDC"/"STFXSA" abbreviations above the school switcher
3. Create a dedicated Logs page for login activity tracking
4. Implement role-based permission assignment pages

---

## Part 1: Dashboard Header Enhancement

### 1.1 Add School Logo to Header
**File:** `src/components/dashboard/DashboardHeader.tsx`

- Import `useSchoolSettings` hook to access the school's `logo_url`
- Add a logo image container next to the school name
- Display the school logo from `schoolSettings?.logo_url` if available
- Show a fallback icon (GraduationCap) if no logo exists

### 1.2 Remove Abbreviations from School Switcher
**File:** `src/components/layout/DashboardLayout.tsx`

- Modify the school switcher dropdown button (line 375) to show full school name instead of abbreviation
- Update dropdown menu items to show full names: "M.A Brain Development Center" and "St. Francis Xavier Smart Academy Inc"
- Keep the color indicators for visual distinction

---

## Part 2: Activity Logs Page

### 2.1 Create New Component
**New File:** `src/components/admin/ActivityLogs.tsx`

This page will display:
- **Login activity table** with columns:
  - Timestamp
  - User email/name
  - Action (login/logout)
  - IP address
  - Status (success/failure)
  
- **Features:**
  - Date range filter
  - Action type filter (login/logout/all)
  - Search by user
  - Export to CSV functionality
  - Pagination for large datasets

### 2.2 Data Source
The existing `school_access_logs` table already captures access events. We will:
- Create a new table `auth_activity_logs` to specifically track login/logout events
- Populate it using a trigger on auth events or by fetching from Lovable Cloud's auth logs

### 2.3 Database Changes
```sql
-- Create auth activity logs table
CREATE TABLE public.auth_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_name TEXT,
  action TEXT NOT NULL, -- 'login', 'logout', 'failed_login'
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policy
CREATE POLICY "Admins can view all auth logs"
  ON public.auth_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### 2.4 Integration
- Add "Activity Logs" navigation item for admin role in `DashboardLayout.tsx`
- Add tab handling in `Index.tsx` for the logs page

---

## Part 3: Role-Based Permission Management

### 3.1 Create Permission Management Component
**New File:** `src/components/admin/PermissionManagement.tsx`

This module provides:

**User List with Role Display:**
- Table showing all users with their current roles
- Filter by role type
- Search by name/email

**Role Assignment Panel:**
- Select user from list
- View current role and permissions
- Assign new role from dropdown (admin, registrar, teacher, student, parent)
- School access assignment for multi-school users

**Permission Grid:**
- Visual display of what each role can access
- Read-only reference for administrators

### 3.2 Create Role Assignment Dialog
**New File:** `src/components/admin/RoleAssignmentDialog.tsx`

- Modal dialog for changing user roles
- Confirmation step before role changes
- Audit logging of role changes

### 3.3 Create School Access Management
**New File:** `src/components/admin/SchoolAccessManager.tsx`

- Manage which schools each user can access
- Grant/revoke school access
- View access history

### 3.4 Database Changes
```sql
-- Add role change audit logging
CREATE TABLE public.role_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  old_role app_role,
  new_role app_role NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Admins can manage role logs"
  ON public.role_change_logs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### 3.5 Update Admin Panel Tabs
**File:** `src/components/admin/AdminPanel.tsx`

- Add new tabs: "Permissions" and "Logs"
- Integrate the new components

---

## Part 4: Navigation Updates

### 4.1 Update Dashboard Layout Navigation
**File:** `src/components/layout/DashboardLayout.tsx`

Add new navigation items for admin role:
- "Activity Logs" - links to logs page
- "Permissions" - links to permission management

### 4.2 Update Index.tsx
**File:** `src/pages/Index.tsx`

Add route handling for:
- `logs` tab - renders `ActivityLogs` component
- `permissions` tab - renders `PermissionManagement` component

---

## Implementation Order

1. **Phase 1 - Header Updates** (Quick wins)
   - Add logo to dashboard header
   - Update school switcher text

2. **Phase 2 - Database Setup**
   - Create `auth_activity_logs` table
   - Create `role_change_logs` table
   - Set up RLS policies

3. **Phase 3 - Activity Logs Page**
   - Create `ActivityLogs.tsx` component
   - Add navigation and routing

4. **Phase 4 - Permission Management**
   - Create `PermissionManagement.tsx`
   - Create `RoleAssignmentDialog.tsx`
   - Create `SchoolAccessManager.tsx`
   - Update AdminPanel tabs

---

## Technical Details

### Files to Create
- `src/components/admin/ActivityLogs.tsx`
- `src/components/admin/PermissionManagement.tsx`
- `src/components/admin/RoleAssignmentDialog.tsx`
- `src/components/admin/SchoolAccessManager.tsx`

### Files to Modify
- `src/components/dashboard/DashboardHeader.tsx` - Add logo
- `src/components/layout/DashboardLayout.tsx` - Update school switcher text, add nav items
- `src/components/admin/AdminPanel.tsx` - Add new tabs
- `src/pages/Index.tsx` - Add route handlers

### Database Migrations
- Create `auth_activity_logs` table with RLS
- Create `role_change_logs` table with RLS
