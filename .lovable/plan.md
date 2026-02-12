

# Academic Year Data Segregation and Locking

## Summary
Implement proper data isolation between academic years by adding a read-only enforcement layer. Currently, users can freely switch between academic years and modify data in any year -- there is no write-protection for past/non-current years. This plan adds both database-level and application-level safeguards.

---

## What Changes

### 1. Database: Add trigger to block writes on non-current academic years

Create a reusable database trigger function `enforce_current_academic_year()` that blocks INSERT, UPDATE, and DELETE operations on records whose `academic_year_id` belongs to a non-current (or archived) academic year. This trigger will be attached to all 14 tables that have `academic_year_id`:

- students, student_grades, student_attendance, raw_scores, student_subjects
- student_assessments, student_assignments, payments, admissions
- class_schedules, exam_schedules, announcements, school_events, finance_clearance

The trigger will:
- Look up the `academic_year` record for the row's `academic_year_id`
- If `is_current = false` OR `is_archived = true`, raise an exception: "Cannot modify records for a non-current academic year"
- Allow an override for admin-level operations via a database setting (`SET LOCAL app.bypass_year_lock = 'true'`) for archiving/promotion workflows

### 2. Enhance AcademicYearContext with `isReadOnly` flag

Update `src/contexts/AcademicYearContext.tsx` to:
- Add `is_archived` to the `AcademicYear` interface
- Expose a computed `isReadOnly` boolean: `true` when the selected year is not the current year OR is archived
- Components can then use `isReadOnly` to disable mutation UI elements

### 3. Create a `useYearGuard` hook

New file: `src/hooks/useYearGuard.ts`

A small hook that returns `{ isReadOnly, guardMessage }` from the academic year context. Components call this before mutations to show a toast and abort if the year is locked.

### 4. Add read-only guards to key write operations

Update the following files to check `isReadOnly` before allowing mutations:

| Component | Write Operation | Guard |
|-----------|----------------|-------|
| `useStudents.ts` (useCreateStudent, useUpdateStudent, useDeleteStudent) | Student CRUD | Check isReadOnly, throw with message |
| `StudentFormModal.tsx` | Add/Edit student form | Disable form submit button, show banner |
| `EnrollmentManagement.tsx` | Enroll students | Disable enroll button |
| `AttendanceManagement.tsx` | Record attendance | Disable submit |
| `ExamScheduleManagement.tsx` | Add/edit exams | Disable form |
| `ScheduleManagement.tsx` | Add/edit schedules | Disable form |
| `PaymentCollection.tsx` | Record payments | Disable payment form |
| `CSVImport.tsx` | Bulk import | Disable import button |

Each guarded component will show a yellow banner: "You are viewing [Year Name]. This year is locked. Switch to the current year to make changes."

### 5. Update "Set as Current" to auto-lock previous year

In `AcademicYearManagement.tsx`, when `handleSetCurrent()` is called:
- After setting the new year as current, the old current year's `is_archived` status remains unchanged (archiving is a separate deliberate action)
- The database trigger handles the locking automatically -- as soon as `is_current` flips to `false`, writes are blocked
- No additional application code needed for this

### 6. Read-only banner component

New file: `src/components/ui/YearLockedBanner.tsx`

A reusable banner that displays when `isReadOnly` is true:
- Shows the year name and a lock icon
- "Switch to current year" button that calls `setSelectedYearId` with the current year's ID
- Used across all data-entry pages

---

## Technical Details

### Database Migration SQL

```sql
-- Function to enforce writes only on current academic year
CREATE OR REPLACE FUNCTION enforce_current_academic_year()
RETURNS TRIGGER AS $$
DECLARE
  year_record RECORD;
  bypass TEXT;
BEGIN
  -- Allow bypass for admin operations (promotion, archiving)
  bypass := current_setting('app.bypass_year_lock', true);
  IF bypass = 'true' THEN
    RETURN NEW;
  END IF;

  -- For DELETE, check OLD record
  IF TG_OP = 'DELETE' THEN
    SELECT is_current, is_archived INTO year_record
    FROM academic_years WHERE id = OLD.academic_year_id;
  ELSE
    SELECT is_current, is_archived INTO year_record
    FROM academic_years WHERE id = NEW.academic_year_id;
  END IF;

  -- If year not found, allow (safety)
  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF year_record.is_archived = true THEN
    RAISE EXCEPTION 'Cannot modify records: academic year is archived and locked';
  END IF;

  IF year_record.is_current IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Cannot modify records: academic year is not the current active year';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

Then attach to all 14 tables with `academic_year_id`.

### Files to Create
- `src/hooks/useYearGuard.ts` -- Guard hook
- `src/components/ui/YearLockedBanner.tsx` -- Reusable banner

### Files to Modify (~12 files)
- `src/contexts/AcademicYearContext.tsx` -- Add `isReadOnly`, `is_archived` to interface
- `src/hooks/useStudents.ts` -- Add year guard to mutations
- `src/components/students/StudentFormModal.tsx` -- Disable when read-only
- `src/components/curriculum/EnrollmentManagement.tsx` -- Disable enrollment
- `src/components/management/AttendanceManagement.tsx` -- Disable attendance recording
- `src/components/management/ExamScheduleManagement.tsx` -- Disable exam schedule edits
- `src/components/management/ScheduleManagement.tsx` -- Disable schedule edits
- `src/components/finance/PaymentCollection.tsx` -- Disable payment recording
- `src/components/import/CSVImport.tsx` -- Disable import
- `src/components/curriculum/AcademicYearManagement.tsx` -- Minor: ensure promotion workflow sets bypass flag
- `src/components/curriculum/PromoteStudentsWorkflow.tsx` -- Use RPC or bypass for year transition

### Edge Cases Handled
- **Viewing historical data**: All SELECT queries continue to work normally -- only writes are blocked
- **Promotion workflow**: Uses `SET LOCAL app.bypass_year_lock = 'true'` via an RPC function to allow the transition
- **Archiving**: Same bypass mechanism for the archive operation
- **Year switcher**: Users can still switch years freely for viewing, but write actions are disabled in the UI with clear messaging
- **Multiple non-current years**: All non-current years are equally locked, regardless of whether they are archived

