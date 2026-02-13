
# User Profile Management System with Principal Role

## Overview
Add a new "principal" role to the system with a dedicated portal, build profile pages for Registrar/Finance/Principal roles, implement admin-assisted password reset with password history tracking, and create the principal account for `rogelio@sfxsai.com`.

---

## 1. Add "principal" to the app_role Enum

**Database Migration:**
- Extend the `app_role` enum: `ALTER TYPE public.app_role ADD VALUE 'principal';`
- Add profile fields to the `profiles` table:
  - `phone` (text, nullable)
  - `employee_id` (text, nullable)
  - `department` (text, nullable)
  - `position` (text, nullable)
  - `years_of_service` (integer, nullable)

**Create password history table:**
```text
password_history (
  id uuid PK,
  user_id uuid FK -> auth.users ON DELETE CASCADE,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
)
```
- RLS: no public access (accessed only via security definer functions)

---

## 2. Create the Principal Account

**Database inserts** (via edge function or migration data):
- Create auth user for `rogelio@sfxsai.com` with password `torrente` using the existing `create-users` edge function
- Insert into `profiles` and `user_roles` with role `principal`
- Insert into `user_credentials` for admin management

---

## 3. Update AuthContext and Role References

**File: `src/contexts/AuthContext.tsx`**
- Add `'principal'` to the `AppRole` type union

**File: `src/components/admin/PermissionManagement.tsx`**
- Add `principal` to `roleColors` and `roleDescriptions`
- Add `principal` option to the role filter dropdown

**File: `src/components/admin/RoleAssignmentDialog.tsx`**
- Add `principal` to the available roles list

---

## 4. Principal Portal and Navigation

**New File: `src/components/portals/PrincipalPortal.tsx`**
- Dashboard with administrative oversight: student count, teacher count, finance summary
- Quick action cards for Reports, Grades overview, Events, Messages
- Similar layout to AdminPortal but focused on oversight (read-heavy, not management)

**File: `src/components/layout/DashboardLayout.tsx`**
- Add `case 'principal'` to `getNavGroupsForRole()` with sidebar items:
  - Portal Home, Learner Records (read-only view), Academics (Grades, Reports), School Management (Teachers, Events), Resources (Library), Profile, Helpdesk
- Add principal icon mappings to `icon3DMap` and `iconAppleMap`

**File: `src/pages/Index.tsx`**
- Add `case 'principal'` to `renderPortal()` returning `<PrincipalPortal />`
- Grant principal access to relevant tabs (students, grades, reports, teachers, events, library, helpdesk) in read-only or oversight mode

---

## 5. Profile Page for All Roles

**New File: `src/components/profile/UserProfilePage.tsx`**
- Comprehensive profile page usable by all roles (principal, registrar, finance, etc.)
- Sections:
  - **Personal Info**: Name, email, phone, employee ID (editable)
  - **Professional Info**: Department, position, years of service (editable)
  - **Profile Photo**: Upload with preview, JPG/PNG only, max 5MB, auto-resize to 300x300 using canvas API, stored in a new `profile-photos` storage bucket
  - **Default avatar** using initials if no photo uploaded
- Saves to `profiles` table via Supabase update

**File: `src/pages/Index.tsx`**
- Add `activeTab === 'my-profile'` rendering `<UserProfilePage />`
- Accessible from the top-right user dropdown menu

**File: `src/components/layout/DashboardLayout.tsx`**
- Add "My Profile" link to the user avatar dropdown menu (for all roles)

---

## 6. Admin-Assisted Password Reset with History

**New File: `src/components/admin/ResetPasswordDialog.tsx`**
- Dialog for admins to reset any user's password
- Password validation: min 8 chars, uppercase, lowercase, number, special character
- Shows validation rules with checkmarks as user types
- Calls the `reset-password` edge function

**New Edge Function: `supabase/functions/reset-password/index.ts`**
- Accepts `{ userId, newPassword }` from authenticated admin
- Verifies requester is admin via `has_role()` check
- Hashes the new password with bcrypt (via Deno std library)
- Checks `password_history` table for last 5 hashes -- rejects if match found
- If valid, updates password via `supabase.auth.admin.updateUserById()`
- Stores new hash in `password_history`
- Returns success

**Integration in PermissionManagement.tsx:**
- Add a "Reset Password" button per user row
- Opens `ResetPasswordDialog` for the selected user

---

## 7. Session Timeout (30 min inactivity)

**File: `src/contexts/AuthContext.tsx`**
- Add an activity tracker (mousemove, keydown, click listeners)
- After 30 minutes of no activity, automatically call `signOut()`
- Show a warning toast 2 minutes before timeout
- Only active for the `principal` role (or optionally all roles)

---

## 8. Storage Bucket for Profile Photos

**Database Migration:**
```text
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);

-- RLS: authenticated users can upload their own photo
CREATE POLICY "Users can upload own photo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view profile photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update own photo" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
```

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/portals/PrincipalPortal.tsx` | Principal's dashboard portal |
| `src/components/profile/UserProfilePage.tsx` | Universal profile page with photo upload |
| `src/components/admin/ResetPasswordDialog.tsx` | Admin password reset dialog |
| `supabase/functions/reset-password/index.ts` | Password reset with history check |

### Files to Modify
| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | Add 'principal' to AppRole, add session timeout |
| `src/components/layout/DashboardLayout.tsx` | Add principal nav, profile link in dropdown |
| `src/pages/Index.tsx` | Add principal portal rendering, profile tab |
| `src/components/admin/PermissionManagement.tsx` | Add principal role color/description, reset password button |
| `src/pages/Auth.tsx` | No changes needed (principal logs in normally) |

### Database Migrations
1. Extend `app_role` enum with `'principal'`
2. Add profile fields (phone, employee_id, department, position, years_of_service)
3. Create `password_history` table with RLS
4. Create `profile-photos` storage bucket with policies
5. Create principal user account for `rogelio@sfxsai.com`

### Dependencies
All dependencies are already installed (jspdf, framer-motion, lucide-react, etc.). No new packages needed. Bcrypt for edge function uses Deno's standard library (`https://deno.land/x/bcrypt`).
