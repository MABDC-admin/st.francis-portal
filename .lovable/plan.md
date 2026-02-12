

# Fix: "School not found" in Academic Years Module

## Root Cause
The school code is mismatched between the frontend and database:
- **Frontend** (`SchoolContext.tsx`): Uses code `STFXSA`
- **Database** (`schools` table): Has code `SFXSAI`
- **schoolIdMap.ts**: Also uses `STFXSA`

When `useSchoolId` hook queries `schools` table with `.eq('code', 'STFXSA')`, it finds nothing, returns `null`, and the Academic Years page shows "School not found."

## Fix

Update the **SchoolContext** and **schoolIdMap** to use the correct database code `SFXSAI`:

### File 1: `src/contexts/SchoolContext.tsx`
- Change `SchoolType` from `'STFXSA'` to `'SFXSAI'`
- Update the `SCHOOL_THEMES` key from `STFXSA` to `SFXSAI`
- Update the default `useState` value to `'SFXSAI'`

### File 2: `src/utils/schoolIdMap.ts`
- Change the key from `'STFXSA'` to `'SFXSAI'`

This is a one-line-each fix in two files. No database changes needed -- the database already has the correct code.

