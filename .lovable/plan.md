
# Fix: Excalidraw "Failed to create drawing" Error

## Root Cause
The `ExcalidrawDashboard` component passes `selectedSchool` (a school **code** like `"MABDC"`) directly as `school_id`, but the `excalidraw_drawings` table expects a **UUID**. This causes both the SELECT query and INSERT to fail with `"invalid input syntax for type uuid"`.

## Solution
Update `ExcalidrawDashboard.tsx` to look up the school's UUID from the `schools` table using the school code, then use that UUID for all database operations.

## Technical Details

**File: `src/components/excalidraw/ExcalidrawDashboard.tsx`**

1. Add a state variable `schoolUuid` and a `useEffect` that queries the `schools` table to get the UUID matching the current `selectedSchool` code:
   ```typescript
   const [schoolUuid, setSchoolUuid] = useState<string | null>(null);

   useEffect(() => {
     if (!selectedSchool) return;
     supabase.from('schools').select('id').eq('code', selectedSchool).single()
       .then(({ data }) => setSchoolUuid(data?.id || null));
   }, [selectedSchool]);
   ```

2. Update `loadDrawings()` to use `schoolUuid` instead of `selectedSchool` in the `.eq('school_id', ...)` filter.

3. Update `createDrawing()` to use `schoolUuid` instead of `selectedSchool` for the `school_id` insert value.

4. Guard both functions with `if (!schoolUuid) return;` checks.

This is a minimal fix -- only the ExcalidrawDashboard component needs to change, and it follows the same pattern other components likely use when bridging school codes to UUIDs.
