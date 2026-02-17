

## Fix: Remove `has_max_score` from Database Payload

### Problem
The `has_max_score` field is a UI-only toggle (used to enable/disable the max score input). However, the save function spreads the entire `formData` object (which includes `has_max_score`) into the database insert/update payload. Since this column doesn't exist in the `student_assignments` table, the operation fails with a schema cache error.

### Solution
In `AssignmentManagement.tsx`, destructure out `has_max_score` before building the database payload so it never gets sent to the database.

### Technical Details

**File: `src/components/management/AssignmentManagement.tsx` (lines ~125-132)**

Change the `saveMutation` to exclude `has_max_score` from the payload:

```typescript
mutationFn: async (data: typeof formData) => {
  if (!schoolId || !selectedYearId) throw new Error('Missing school or academic year');

  const { has_max_score, ...dbFields } = data;
  const payload = {
    ...dbFields,
    max_score: has_max_score ? dbFields.max_score : 0,
    school_id: schoolId,
    academic_year_id: selectedYearId,
  };
  // ... rest unchanged
```

This strips the UI-only field and also ensures `max_score` is set to `0` when the "Graded" checkbox is unchecked.

**Files to modify:**
- `src/components/management/AssignmentManagement.tsx` -- one small change in the mutation function

