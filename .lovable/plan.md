
# Fix Admission Form Crash and Enhance Admission/Registration System

## Summary
Fix the crash caused by empty-string `SelectItem` values in the enrollment form, restructure the form fields per DepEd standards, add an LRN toggle, upgrade the Admissions page with tabbed Pending/Approved views, and create a new Online Registration system with its own database table and management page.

---

## Part 1: Fix the Crash (Critical)

**Root cause:** `<SelectItem value="">` is used as section headers in the Grade Level and SHS Strand dropdowns in `StudentInfoStep.tsx`. Radix UI Select forbids empty-string values.

**Fix:** Replace all `<SelectItem value="" disabled>` section headers with `<SelectGroup>` + `<SelectLabel>` from the Radix Select component, which are designed for non-selectable group labels.

**File:** `src/components/enrollment/steps/StudentInfoStep.tsx`
- Lines 103, 107, 111: Replace grade level section headers
- Lines 137, 141, 145: Replace strand section headers

Also fix `src/components/management/ScheduleManagement.tsx` line 484 (`SelectItem value=""` for "No teacher") -- change to a placeholder value like `"none"`.

---

## Part 2: Reorder Form Fields and Add LRN Toggle

**File:** `src/components/enrollment/steps/StudentInfoStep.tsx`

Changes:
1. Move **Grade Level** to be the first field (before Full Name)
2. Add an **LRN Toggle** (Yes/No switch) after Grade Level
   - Default to "Yes" for non-Kindergarten, "No" for Kindergarten
   - When "No", hide the LRN input field entirely
   - When "Yes", show the LRN input field
3. Reorder remaining fields: Full Name, Academic Year, Birth Date, Age, Gender, SHS Strand (conditional), Mother Tongue, Dialects

**File:** `src/components/enrollment/EnrollmentWizard.tsx`
- Add `hasLrn` boolean to form state (default `true`)
- Update validation in `validateStep`: skip LRN validation when `hasLrn` is false
- Pass `hasLrn` and `setHasLrn` to `StudentInfoStep`

**File:** `src/components/enrollment/steps/StudentInfoStep.tsx`
- Accept new props: `hasLrn`, `onToggleLrn`
- Render a toggle/switch for LRN visibility
- Conditionally show/hide LRN input

---

## Part 3: Upgrade Admissions Page with Tabs

**File:** `src/components/admissions/AdmissionsPage.tsx`

Replace the single status-filter dropdown with a proper tabbed layout:
- **Tab 1: Pending** -- shows only pending admissions with Approve/Reject actions
- **Tab 2: Approved** -- shows approved admissions (read-only)
- **Tab 3: Rejected** -- shows rejected admissions with rejection reason

Uses the existing `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` components. Each tab queries with the appropriate status filter. Remove the old Select-based status filter.

---

## Part 4: Online Registration System

### 4a. Database Table

Create a new `online_registrations` table:
- `id` (uuid, PK)
- `student_name` (text, NOT NULL)
- `lrn` (text, nullable)
- `level` (text, NOT NULL)
- `strand` (text, nullable)
- `birth_date` (date, nullable)
- `gender` (text, nullable)
- `mother_maiden_name`, `mother_contact`, `father_name`, `father_contact` (text, nullable)
- `phil_address`, `uae_address` (text, nullable)
- `previous_school` (text, nullable)
- `parent_email` (text, nullable)
- `mother_tongue`, `dialects` (text, nullable)
- `school_id` (uuid, NOT NULL)
- `academic_year_id` (uuid, NOT NULL)
- `status` (text, NOT NULL, default 'pending')
- `reviewed_by` (uuid, nullable)
- `reviewed_at` (timestamptz, nullable)
- `rejection_reason` (text, nullable)
- `created_at`, `updated_at` (timestamptz, defaults)

RLS policies: Admin and Registrar can SELECT, INSERT, UPDATE. Public INSERT for the online form (with check constraint on status = 'pending').

### 4b. Online Registration Form Page

**New file:** `src/components/registration/OnlineRegistrationForm.tsx`

A standalone, public-facing registration form (simpler than the enrollment wizard):
- Grade Level first, LRN toggle, basic student info, parent info, address
- Submits to `online_registrations` table with status 'pending'
- Success confirmation screen after submission
- No authentication required

### 4c. Registration Management Page

**New file:** `src/components/registration/RegistrationManagement.tsx`

Admin/Registrar page with:
- **Pending Registrations** tab -- with Approve/Reject actions
- **Approved Registrations** tab -- read-only list
- Approval creates a student record (similar to admission approval flow)
- Detail dialog for viewing full registration info

### 4d. Wire into Navigation

**File:** `src/pages/Index.tsx`
- Import and render `RegistrationManagement` for a new `activeTab === 'registrations'`
- Import and render `OnlineRegistrationForm` for a public route or tab

**File:** Sidebar navigation (DashboardLayout or nav config)
- Add "Registrations" menu item for Admin/Registrar roles

---

## Part 5: Additional Fixes

- Fix `ScheduleManagement.tsx` line 484: change `<SelectItem value="">No teacher</SelectItem>` to `<SelectItem value="none">No teacher</SelectItem>` and handle "none" as null in the save logic
- Add `SelectGroup` and `SelectLabel` imports to `src/components/ui/select.tsx` if not already exported

---

## Technical Details

### Files to Create
- `src/components/registration/OnlineRegistrationForm.tsx`
- `src/components/registration/RegistrationManagement.tsx`

### Files to Modify
- `src/components/enrollment/steps/StudentInfoStep.tsx` -- fix crash, reorder fields, add LRN toggle
- `src/components/enrollment/EnrollmentWizard.tsx` -- add `hasLrn` state, update validation
- `src/components/admissions/AdmissionsPage.tsx` -- replace filter with tabs
- `src/components/management/ScheduleManagement.tsx` -- fix empty value SelectItem
- `src/components/ui/select.tsx` -- export SelectGroup/SelectLabel if needed
- `src/pages/Index.tsx` -- add registrations tab routing

### Database Migration
- Create `online_registrations` table with RLS policies

### Component Dependencies
- Uses existing: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Switch`, `Select`, `SelectGroup`, `SelectLabel`
- Uses existing contexts: `useAcademicYear`, `useSchool`, `useAuth`
