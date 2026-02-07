

# Implementation Plan: Data Quality, Archiving, and Immutable Grades Workflow

## Current Status

After a thorough review of the codebase and database, **none of these three features exist yet**. The current system has:
- A `student_grades` table with basic quarter grades (q1-q4), final_grade, and remarks -- no status, approval, or audit fields
- An `academic_years` table with `is_current` flag but no archiving or freezing capability
- No data validation engine or dashboard
- No grade approval workflow or change request system

---

## Feature 1: Data Validation Rules Engine + Admin Data Fix Dashboard

### What It Does
Automatically scans all student records to find problems -- missing birthdates, invalid phone numbers, duplicate students, and incomplete requirements -- then displays them in a dedicated "Admin Data Fix" dashboard where admins can fix issues one by one or in bulk.

### Database Changes
- New table: `data_validation_issues` -- stores detected issues (student_id, issue_type, description, severity, is_resolved, resolved_by, resolved_at)
- RLS policies for admin-only access

### UI Component
- New component: `src/components/admin/DataQualityDashboard.tsx`
- Summary cards showing counts by issue type (missing birthdate, invalid contact, duplicate, incomplete docs)
- Filterable table of all issues with direct "Fix" links that open the student editor
- "Run Scan" button to re-validate all records
- Auto-resolve when underlying data is corrected

### Validation Rules
| Rule | Check |
|------|-------|
| Missing birthdate | `birth_date IS NULL` |
| Invalid guardian numbers | Phone fields not matching expected format (e.g., too short, non-numeric) |
| Duplicate students | Same `lrn` or very similar `student_name` + `birth_date` combo |
| Incomplete requirements | Students missing key fields (gender, address, guardian info) |

### Integration
- Add a "Data Quality" tab to the existing Admin Panel (`AdminPanel.tsx`)
- Show a warning badge on the Admin nav item when unresolved issues exist

---

## Feature 2: Automated Archiving by School Year

### What It Does
When a school year ends, admins can "close" it, which freezes all grades for that year, creates snapshot records for report cards, and marks inactive student accounts.

### Database Changes
- Add columns to `academic_years`: `is_archived` (boolean, default false), `archived_at` (timestamp), `archived_by` (uuid)
- New table: `grade_snapshots` -- immutable copy of grades at archive time (student_id, subject_id, academic_year_id, q1-q4, final_grade, snapshot_data JSONB, created_at)
- New table: `archived_student_status` -- tracks which students were active/inactive per year

### UI Components
- New component: `src/components/curriculum/AcademicYearArchive.tsx`
- Archive button on past academic years (with confirmation dialog)
- Shows archive status and date on each year
- Prevents grade edits on archived years (enforced in `GradesManagement.tsx`)

### Logic
1. Admin clicks "Archive Year" on a past academic year
2. System copies all `student_grades` for that year into `grade_snapshots`
3. Sets `is_archived = true` on the academic year
4. All grade editing UI checks `is_archived` and disables editing if true

---

## Feature 3: Immutable "Final Grades" Workflow

### What It Does
Introduces a 3-step approval flow: Teacher submits grades, Department Head approves, Admin finalizes. After finalization, any edit requires a formal "change request" with a reason.

### Database Changes
- Add columns to `student_grades`:
  - `status` (text, default 'draft') -- values: draft, submitted, approved, finalized
  - `submitted_by` (uuid), `submitted_at` (timestamp)
  - `approved_by` (uuid), `approved_at` (timestamp)
  - `finalized_by` (uuid), `finalized_at` (timestamp)
- New table: `grade_change_requests` -- id, student_grade_id, requested_by, reason, old_values (JSONB), new_values (JSONB), status (pending/approved/rejected), reviewed_by, reviewed_at, created_at
- RLS policies enforcing role-based access

### UI Changes
- Update `GradesManagement.tsx`:
  - Show grade status badges (Draft, Submitted, Approved, Finalized)
  - "Submit for Approval" button for teachers
  - "Approve" / "Reject" buttons for department heads
  - "Finalize" button for admins
  - Disable direct editing on finalized grades
- New component: `src/components/grades/GradeChangeRequestDialog.tsx`
  - Form to request a change to finalized grades (reason required)
  - Shows history of change requests
- New component: `src/components/grades/GradeApprovalQueue.tsx`
  - Lists grades pending approval for department heads
  - Lists change requests pending review for admins

### Workflow Diagram (text)

```text
Teacher enters grades --> status: "draft"
        |
Teacher clicks "Submit" --> status: "submitted"
        |
Dept Head clicks "Approve" --> status: "approved"
        |
Admin clicks "Finalize" --> status: "finalized"
        |
  (Locked -- edits require Change Request)
        |
Teacher submits Change Request with reason
        |
Admin reviews and approves/rejects
```

---

## Implementation Order

1. **Database migrations first** -- create all new tables and add columns
2. **Feature 1** (Data Quality) -- standalone, no dependencies on other features
3. **Feature 2** (Archiving) -- builds on academic years
4. **Feature 3** (Grade Workflow) -- most complex, modifies existing grade management

## Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/components/admin/DataQualityDashboard.tsx` |
| Create | `src/components/curriculum/AcademicYearArchive.tsx` |
| Create | `src/components/grades/GradeChangeRequestDialog.tsx` |
| Create | `src/components/grades/GradeApprovalQueue.tsx` |
| Modify | `src/components/admin/AdminPanel.tsx` -- add Data Quality tab |
| Modify | `src/components/grades/GradesManagement.tsx` -- add status workflow, disable edits on finalized |
| Modify | `src/components/curriculum/AcademicYearManagement.tsx` -- add archive controls |
| Migration | New tables + column additions as described above |

