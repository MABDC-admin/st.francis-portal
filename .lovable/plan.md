

# Fix: Make Google Docs Available Across All Schools

## Problem
Two issues exist in `GoogleDocsDashboard.tsx`:
1. **UUID mismatch**: The code passes the school code string (e.g., `"STFXSA"`) to the `school_id` column which expects a UUID, causing a `22P02` database error.
2. **School filtering**: Documents are currently scoped per-school, but they should be shared across all schools.

## Solution
Remove school-based filtering entirely so all Google Docs are visible and accessible regardless of which school is selected.

## Technical Details

### File to Modify
**`src/components/googledocs/GoogleDocsDashboard.tsx`**

Changes:
- Remove the `useSchool` import and `selectedSchool` usage
- Remove the `school_id` filter from `fetchDocs` query (fetch all docs regardless of school)
- Remove `school_id` from the `handleAdd` insert (store docs without school association, or set to `null`)
- Remove `selectedSchool` from the `useEffect` dependency array
- This also fixes the UUID type mismatch error since `school_id` will no longer be set

