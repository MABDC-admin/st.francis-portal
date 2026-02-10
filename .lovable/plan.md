
# Fix Grades Loading Loop in Student Profile

## Root Cause

The Grades tab inside each student's profile is stuck in an **infinite loading spinner** because:

1. **`StudentDetailPanel.tsx` (line 48)** fetches the current academic year using `.single()`, but there are **2 rows** with `is_current = true` in the database (one per school: MABDC and STFXSA). The `.single()` call **throws an error** when it gets multiple results, so `currentAcademicYearId` is never set, and the Grades tab renders a forever-spinning loader.

2. **`LISAcademicHistory.tsx` (line 63)** also uses `.single()` inside a nested query to look up the student's LRN, which can similarly fail.

## Fix

### 1. `src/components/students/StudentDetailPanel.tsx`

- Change the academic year query from `.single()` to filter by the student's `school_id` (or `school` code), so it returns only the one matching current year
- Use `.maybeSingle()` as a safety net in case no current year exists
- Add a fallback message instead of an infinite spinner if no year is found

### 2. `src/components/lis/LISAcademicHistory.tsx`

- Replace the nested `.single()` call on line 63 with `.maybeSingle()` to prevent crashes when the student record isn't found

## Technical Details

### StudentDetailPanel.tsx (lines 43-53)

Current (broken):
```typescript
const { data } = await supabase
  .from('academic_years')
  .select('id')
  .eq('is_current', true)
  .single(); // FAILS: 2 rows returned
```

Fixed -- filter by the student's school:
```typescript
const { data } = await supabase
  .from('academic_years')
  .select('id')
  .eq('is_current', true)
  .eq('school_id', student.school_id)
  .maybeSingle();
```

If the student has no `school_id`, fall back to selecting the first current year with `.limit(1).maybeSingle()`.

### LISAcademicHistory.tsx (line 63)

Change `.single()` to `.maybeSingle()` to prevent the query from throwing when no student record matches.

## Files to Change

| File | Change |
|------|--------|
| `src/components/students/StudentDetailPanel.tsx` | Filter academic year by student's school_id, use .maybeSingle(), add empty-state fallback |
| `src/components/lis/LISAcademicHistory.tsx` | Replace .single() with .maybeSingle() on LRN lookup |
