

# Remove Old Academic Years and Create New One

## Steps

### 1. Delete stale academic year data
Remove the academic year record `2025-2026` that was created under the old school UUID (`22222222-2222-2222-2222-222222222222`). This record is orphaned since the school now uses `11111111-1111-1111-1111-111111111111`.

### 2. Create a new academic year for the correct school
Insert a fresh `2025-2026` academic year for school `11111111-1111-1111-1111-111111111111`, set as the current year.

### Technical Details

**Database migration:**
```sql
-- Remove orphaned academic year under old school UUID
DELETE FROM academic_years 
WHERE school_id = '22222222-2222-2222-2222-222222222222';

-- Insert new academic year for the correct school
INSERT INTO academic_years (school_id, name, start_date, end_date, is_current)
VALUES ('11111111-1111-1111-1111-111111111111', '2025-2026', '2025-08-01', '2026-07-31', true);
```

No code file changes are needed -- the `AcademicYearManagement` component and `useSchoolId` hook already reference the correct school ID via the updated `schoolIdMap`.

