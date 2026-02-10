

# Fix: "Loading school context..." Infinite Loop

## Problem

The Academic Years page is stuck on "Loading school context..." because the `useSchoolId` hook fails silently. The hook uses `.single()` which throws an error when the query returns no rows (e.g., during initial page load before auth is fully established). The fallback query also uses `.single()`, so both paths fail, returning `null` forever.

The component at line 244 checks `if (isSchoolLoading || !schoolId)` -- once the query resolves with `null`, `isSchoolLoading` becomes `false` but `schoolId` is still `null`, so the loading spinner shows indefinitely.

## Changes

### 1. Fix `src/hooks/useSchoolId.ts`

- Replace `.single()` with `.maybeSingle()` on both the primary and fallback queries to prevent errors when no row is returned
- Add `retry: 3` to the query options so transient auth/RLS timing issues self-resolve

### 2. Fix `src/components/curriculum/AcademicYearManagement.tsx`

- Update the loading guard (line 244) to show an error message when `schoolId` is `null` AND loading is complete, instead of showing the spinner forever
- Display a "School not found" message with a retry button when `isSchoolLoading` is `false` but `schoolId` is `null`

## Technical Details

**useSchoolId.ts changes:**
```typescript
// Change .single() to .maybeSingle() on lines 21 and 30
.maybeSingle();
```

**AcademicYearManagement.tsx changes:**
```typescript
// Line 244: separate loading from error state
if (isSchoolLoading) {
  return <loading spinner />;
}
if (!schoolId) {
  return <error message with retry />;
}
```
