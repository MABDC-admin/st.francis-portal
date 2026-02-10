

# Fix Academic Year Management: School Data Segregation

## Problems Found

1. **Dual academic years showing**: The `fetchYears()` query fetches ALL academic years from both schools without a `school_id` filter, so MABDC and STFXSA years appear together.
2. **Cannot create new academic year**: The insert uses a hardcoded placeholder UUID (`00000000-0000-0000-0000-000000000000`) for `school_id`, which fails the foreign key constraint against the `schools` table.
3. **"Set as Current" affects both schools**: `handleSetCurrent` runs `UPDATE academic_years SET is_current = false WHERE is_current = true` without scoping to the active school, meaning setting a year as current in MABDC would unset the current year for STFXSA too.

## Solution

Integrate the `useSchoolId` hook into `AcademicYearManagement.tsx` so all queries are scoped to the active school.

### File: `src/components/curriculum/AcademicYearManagement.tsx`

**Changes:**

1. Import and use `useSchoolId` hook to get the resolved school UUID
2. **`fetchYears()`** -- Add `.eq('school_id', schoolId)` filter so only the active school's academic years are shown
3. **`handleSave()` (insert)** -- Replace the hardcoded placeholder UUID with the resolved `schoolId` from the hook
4. **`handleSetCurrent()`** -- Scope the "unset all current" update to only the active school: `.eq('school_id', schoolId)`
5. **`handleSave()` (update with `is_current`)** -- Same scoping fix for the "unset others" logic inside the edit/add flow
6. **`handleArchive()`** -- Scope the grade snapshot query by `school_id` as well for correctness
7. Add a loading/disabled state when `schoolId` is not yet resolved, preventing premature queries
8. Re-fetch years when `schoolId` changes (e.g., when the user switches schools)

### No Database Changes Required

The `academic_years` table already has a `school_id` column with a foreign key to `schools(id)`. The data in the database is correct -- both schools have their own academic year records. The issue is purely in the frontend query logic.

