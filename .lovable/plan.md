
# Online Teacher Application System

## Overview
Build a complete teacher hiring pipeline with two major parts:
1. **Public Application Page** (`/apply`) -- a 10-step wizard for anonymous teacher applicants (no account required), following the uploaded markdown spec exactly
2. **Applicant Dashboard** -- a new tab inside the Registrar Portal for reviewing, filtering, and managing teacher applications with status workflow

---

## 1. Database Schema

### New Table: `teacher_applications`
Stores every submitted application with all fields from the 10-step form.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Default `gen_random_uuid()` |
| reference_number | TEXT UNIQUE | Auto-generated `TCH-YYYY-NNNNNN` |
| school_id | UUID FK | References `schools(id)` |
| status | TEXT | Default `'submitted'` -- values: submitted, under_review, shortlisted, interview_scheduled, demo_teaching, approved, rejected, hired |
| -- Personal Info -- | | |
| first_name | TEXT NOT NULL | |
| middle_name | TEXT | |
| last_name | TEXT NOT NULL | |
| suffix | TEXT | |
| gender | TEXT NOT NULL | |
| date_of_birth | DATE NOT NULL | |
| place_of_birth | TEXT | |
| civil_status | TEXT NOT NULL | |
| nationality | TEXT NOT NULL | |
| photo_url | TEXT | Storage path |
| -- Contact -- | | |
| mobile_number | TEXT NOT NULL | |
| alternate_mobile | TEXT | |
| email | TEXT NOT NULL | |
| house_street | TEXT NOT NULL | |
| barangay | TEXT NOT NULL | |
| city_municipality | TEXT NOT NULL | |
| province | TEXT NOT NULL | |
| zip_code | TEXT NOT NULL | |
| country | TEXT NOT NULL | Default `'Philippines'` |
| -- Position -- | | |
| position_applied | TEXT NOT NULL | |
| subject_specialization | TEXT[] | Array |
| preferred_level | TEXT | |
| -- PRC License -- | | |
| has_prc_license | BOOLEAN | Default false |
| prc_license_number | TEXT | |
| prc_expiration_date | DATE | |
| prc_license_url | TEXT | Storage path |
| -- Education -- | | |
| education | JSONB | Array of `{level, course, major, school, year_graduated, honors}` |
| -- Experience -- | | |
| has_experience | BOOLEAN | Default false |
| experience | JSONB | Array of `{school, position, subjects, start_date, end_date, status}` |
| -- Documents -- | | |
| resume_url | TEXT | |
| transcript_url | TEXT | |
| diploma_url | TEXT | |
| valid_id_url | TEXT | |
| certificates_url | TEXT[] | Array of URLs |
| -- Additional -- | | |
| why_join | TEXT | |
| teaching_philosophy | TEXT | |
| expected_salary | TEXT | |
| available_start_date | DATE | |
| -- Admin fields -- | | |
| reviewed_by | UUID | |
| reviewed_at | TIMESTAMPTZ | |
| rejection_reason | TEXT | |
| notes | TEXT | Admin notes |
| created_at | TIMESTAMPTZ | Default `now()` |
| updated_at | TIMESTAMPTZ | Default `now()` |

### New Table: `teacher_application_positions`
Stores the available open positions (managed by admin/registrar).

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| school_id | UUID FK | |
| title | TEXT NOT NULL | e.g. "Kindergarten Teacher" |
| department | TEXT | |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMPTZ | |

### Storage Bucket
- **`teacher-applications`** (public: false) -- stores resumes, transcripts, diplomas, IDs, PRC licenses, certificates, and profile photos

### RLS Policies
- **Anonymous INSERT** on `teacher_applications` -- allows public form submission (insert-only pattern, no `.select()` chain)
- **Authenticated SELECT/UPDATE** for admin and registrar roles via `has_role()` check
- **Storage policies** on `teacher-applications` bucket: anonymous upload allowed; authenticated download for admin/registrar

### Sequence for Reference Numbers
Use a database function triggered on INSERT to auto-generate `TCH-YYYY-NNNNNN` reference numbers using a sequence or row count.

---

## 2. Public Application Page (`/apply`)

### Route
Add `/apply` route in `App.tsx` pointing to a new `PublicTeacherApplicationPage.tsx`.

### Page Structure
Follows the same pattern as the existing `/register` page:
- Sticky header with school branding
- 10-step wizard with progress bar
- Each step is a card with animated transitions (framer-motion)

### Steps (matching the markdown exactly)

| Step | Title | Fields |
|------|-------|--------|
| 1 | Personal Information | First/Middle/Last Name, Suffix, Gender, DOB, Place of Birth, Civil Status, Nationality, Profile Photo upload |
| 2 | Contact Information | Mobile, Alternate Mobile, Email, Full Address (House/Street, Barangay, City, Province, ZIP, Country) |
| 3 | Position Applied For | Position dropdown, Subject Specialization (multi-select), Preferred Level |
| 4 | Professional License | LPT toggle; if Yes: PRC Number, Expiration Date, PRC License upload |
| 5 | Educational Background | Repeatable section: Level (Bachelor/Master/Doctorate), Course, Major, School, Year Graduated, Honors |
| 6 | Teaching Experience | Has experience toggle; if Yes: repeatable section with School, Position, Subjects, Start/End Date, Employment Status |
| 7 | Document Upload | Required: Resume, Transcript, Diploma, Valid ID, Profile Photo. Optional: PRC License, Certificates, Training docs, Recommendation Letter |
| 8 | Additional Questions | Why join, Teaching philosophy, Expected salary, Available start date |
| 9 | Review & Submit | Card-grid summary of all entered data with edit buttons per section |
| 10 | Confirmation | Success message with generated reference number (TCH-2026-XXXXXX) |

### Security
- Uses the same "insert-only" anonymous submission pattern as student registration
- File uploads go to the `teacher-applications` bucket with UUID-prefixed paths
- Client-side file validation: 5MB max, accepted types (image/*, .pdf, .doc, .docx)
- Input sanitization (strip HTML tags)

### New Files
- `src/pages/PublicTeacherApplicationPage.tsx` -- page wrapper (header + form)
- `src/components/teacher-application/TeacherApplicationForm.tsx` -- the 10-step wizard
- `src/components/teacher-application/steps/PersonalInfoStep.tsx`
- `src/components/teacher-application/steps/ContactInfoStep.tsx`
- `src/components/teacher-application/steps/PositionStep.tsx`
- `src/components/teacher-application/steps/PrcLicenseStep.tsx`
- `src/components/teacher-application/steps/EducationStep.tsx`
- `src/components/teacher-application/steps/ExperienceStep.tsx`
- `src/components/teacher-application/steps/DocumentUploadStep.tsx`
- `src/components/teacher-application/steps/AdditionalQuestionsStep.tsx`
- `src/components/teacher-application/steps/ReviewStep.tsx`
- `src/components/teacher-application/steps/ConfirmationStep.tsx`

---

## 3. Applicant Dashboard (Registrar Portal)

### New Tab: `applicants`
Add to the Registrar (and Admin) sidebar navigation under "Learner Records" or a new "Recruitment" group.

### Component: `TeacherApplicantDashboard.tsx`
- **Tabs**: Submitted | Under Review | Shortlisted | Interview | Demo Teaching | Approved | Rejected | Hired
- **Table columns**: Reference #, Name, Position, Email, Mobile, Date Applied, Status, Actions
- **Search/filter** by name, position, status
- **Detail dialog**: View full application data in a read-only card layout with document download links
- **Status workflow buttons**: Move to next stage, Reject (with reason), Add notes
- **Stats cards** at top: Total Applications, Pending Review, Shortlisted, Hired

### Integration Points
- Add `applicants` nav item in `DashboardLayout.tsx` for registrar and admin roles
- Add `activeTab === 'applicants'` rendering in `Index.tsx`
- Add icon mappings in `icon3DMap` and `iconAppleMap`

### New Files
- `src/components/teacher-application/TeacherApplicantDashboard.tsx`
- `src/components/teacher-application/ApplicantDetailDialog.tsx`
- `src/components/teacher-application/ApplicantStatusActions.tsx`

---

## 4. Navigation and Routing Updates

### `App.tsx`
```text
<Route path="/apply" element={<PublicTeacherApplicationPage />} />
```

### `DashboardLayout.tsx`
Add under registrar and admin nav groups:
```text
{ id: 'applicants', icon: TeacherIcon3D, label: 'Teacher Applicants' }
```

### `Index.tsx`
- Import `TeacherApplicantDashboard`
- Add rendering block:
```text
{activeTab === 'applicants' && hasAdminAccess && <TeacherApplicantDashboard />}
```
- Add `applicants` to icon maps

### Registrar Portal
Add a quick-action card: "Teacher Applications" with pending count badge, linking to the `applicants` tab.

---

## 5. Unique Application Link

The registrar can share a unique link for the application form. The system provides:
- A base link: `{origin}/apply`
- A "Copy Link" button in the Registrar Portal and in the `applicants` dashboard header
- The link is publicly accessible without authentication

---

## Technical Summary

| Area | Files | Description |
|------|-------|-------------|
| Database | SQL migration | `teacher_applications` table, `teacher_application_positions` table, RLS policies, reference number function, storage bucket |
| Public Form | 12 new files in `src/components/teacher-application/` + 1 page | 10-step wizard following the uploaded spec |
| Admin Dashboard | 3 new files | Tabbed applicant management with status workflow |
| Routing | `App.tsx` | Add `/apply` route |
| Navigation | `DashboardLayout.tsx`, `Index.tsx` | Add `applicants` tab for registrar/admin |
| Portal | `RegistrarPortal.tsx` | Add quick-action card for teacher applications |
