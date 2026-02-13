

# Fix Finance Role in Admin UI

## Problem
The database correctly stores Ivy Ann's role as `finance`, but the admin UI components don't include `finance` as a valid role option. This causes her to appear incorrectly (as "student" or unrecognized) in management views, even though she correctly gets the Finance Portal on login.

## Root Cause
Four UI components hardcode a list of roles that does NOT include `finance`:

1. **RoleAssignmentDialog.tsx** (line 40) - Only lists: admin, registrar, teacher, student, parent
2. **UserManagement.tsx** (line 594-600) - Role filter dropdown missing finance
3. **PermissionManagement.tsx** (line 181-188) - Role filter dropdown missing finance
4. **GrantAccessDialog.tsx** (line 177-181) - School access role selector missing finance

## Changes

### 1. RoleAssignmentDialog.tsx
- Add `'finance'` to the `roles` array (line 40)
- Add finance color styling to `roleColors` (line 43-49)

### 2. UserManagement.tsx
- Add `<SelectItem value="finance">Finance</SelectItem>` to the role filter dropdown (after line 599)

### 3. PermissionManagement.tsx
- Add `<SelectItem value="finance">Finance</SelectItem>` to the role filter dropdown (after line 187)

### 4. GrantAccessDialog.tsx
- Add `<SelectItem value="finance">Finance</SelectItem>` to the school access role selector (after line 180)

### 5. AuthContext.tsx
- Verify `AppRole` type already includes `finance` -- it does (line 8: `'admin' | 'registrar' | 'teacher' | 'student' | 'parent' | 'finance'`)

## Technical Details

All changes are adding `finance` as a selectable option in existing role dropdowns. No database or backend changes needed -- the data is already correct.

