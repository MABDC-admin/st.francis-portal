
# Confirmation Dialog for School Switching

## What This Does
Adds a confirmation popup whenever you try to switch between schools (MABDC / STFXSA). This prevents accidental switches that could cause unsaved changes to be lost.

The dialog will say: **"Are you sure you want to switch to [School Name]? Any unsaved changes will be lost."** with **Cancel** and **Switch School** buttons.

## Changes

### File: `src/components/layout/DashboardLayout.tsx`

**1. Add imports and state**
- Import `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` from `@/components/ui/alert-dialog`
- Import `SCHOOL_THEMES` and `SchoolType` from `@/contexts/SchoolContext`
- Import `Loader2` from `lucide-react`
- Add two new state variables:
  - `pendingSchool: SchoolType | null` (the school the user wants to switch to)
  - `isSwitching: boolean` (loading indicator during transition)

**2. Create handler function**
- `handleSchoolSwitch(school: SchoolType)` -- if `school === selectedSchool`, do nothing; otherwise set `pendingSchool` to open the dialog
- `confirmSchoolSwitch()` -- calls `setSelectedSchool(pendingSchool)`, sets `isSwitching = true`, clears `pendingSchool`, then sets `isSwitching = false` after a short delay
- `cancelSchoolSwitch()` -- clears `pendingSchool` back to null

**3. Replace direct calls (4 locations)**
- Line 817: `onClick={() => setSelectedSchool('MABDC')}` becomes `onClick={() => handleSchoolSwitch('MABDC')}`
- Line 822: `onClick={() => setSelectedSchool('STFXSA')}` becomes `onClick={() => handleSchoolSwitch('STFXSA')}`
- Line 904: `onClick={() => setSelectedSchool('MABDC')}` becomes `onClick={() => handleSchoolSwitch('MABDC')}`
- Line 914: `onClick={() => setSelectedSchool('STFXSA')}` becomes `onClick(() => handleSchoolSwitch('STFXSA')}`

**4. Disable controls while switching**
- Add `disabled={isSwitching}` to both school switcher dropdown trigger buttons
- Show a `Loader2` spinner icon on the active school switcher button when `isSwitching` is true

**5. Add the AlertDialog at the end of the component JSX**
```text
AlertDialog (open = pendingSchool !== null)
  +-- AlertDialogContent
       +-- AlertDialogHeader
       |    +-- AlertDialogTitle: "Switch School"
       |    +-- AlertDialogDescription:
       |         "Are you sure you want to switch to
       |          [SCHOOL_THEMES[pendingSchool].fullName]?
       |          Any unsaved changes will be lost."
       +-- AlertDialogFooter
            +-- AlertDialogCancel onClick={cancelSchoolSwitch}: "Cancel"
            +-- AlertDialogAction onClick={confirmSchoolSwitch}: "Switch School"
```

## Summary
- Only 1 file modified: `DashboardLayout.tsx`
- No new files, no database changes
- Uses existing `AlertDialog` UI component (already in the project)
- Works for all roles (admin, registrar, finance) that have school switching access
