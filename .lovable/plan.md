

# Convert to Single School: SFXSAI (St. Francis Xavier Smart Academy Inc)

## Overview

Remove all MABDC references and multi-school infrastructure, and rename the school code from `STFXSA` to `SFXSAI` throughout the codebase. The application will operate as a single-school system for **St. Francis Xavier Smart Academy Inc (SFXSAI)**.

## Database Migration

```sql
-- Upsert the school record with the new code
UPDATE schools SET code = 'SFXSAI' WHERE code = 'STFXSA';
INSERT INTO schools (id, name, code)
VALUES ('22222222-2222-2222-2222-222222222222', 'St. Francis Xavier Smart Academy Inc', 'SFXSAI')
ON CONFLICT (id) DO UPDATE SET code = 'SFXSAI', name = 'St. Francis Xavier Smart Academy Inc';

-- Update all students referencing the old code
UPDATE students SET school = 'SFXSAI' WHERE school = 'STFXSA';

-- Update user_school_access if any reference the old code
-- (school_id is UUID-based so no change needed there)
```

## File Changes

### Core Context and Config

**1. `src/contexts/SchoolContext.tsx`**
- Change `SchoolType` from `'MABDC' | 'STFXSA'` to just `'SFXSAI'`
- Remove MABDC entry from `SCHOOL_THEMES`
- Rename STFXSA entry to `SFXSAI`
- Hardcode default to `'SFXSAI'`, make `setSelectedSchool` a no-op
- Set `canSwitchSchool` always `false`

**2. `src/utils/schoolIdMap.ts`**
- Remove MABDC entry
- Rename `'STFXSA'` key to `'SFXSAI'`

**3. `src/components/enrollment/constants.ts`**
- Remove MABDC from `SCHOOLS` array
- Rename STFXSA to `{ id: 'SFXSAI', name: 'St. Francis Xavier Smart Academy Inc', acronym: 'SFXSAI' }`

### Auth and Login

**4. `src/contexts/AuthContext.tsx`**
- Remove MABDC email domain logic
- Change all `'STFXSA'` references to `'SFXSAI'`
- Change `@stfxsa.org` references to `@sfxsai.org` (or keep existing domain -- see question below)
- Remove `setDefaultSchoolForUser` multi-school branching; always set `'SFXSAI'`

**5. `src/pages/Auth.tsx`**
- Remove geolocation-based school detection (`detectLocation` useEffect)
- Remove LRN-based school auto-switching
- Remove geofencing enforcement (PH/AE blocking)
- Remove `mabdcSettings` query
- Hardcode email domain to `@sfxsai.org` for LRN logins
- Remove school-conditional button styling (always blue theme)
- Remove `hasIdentified`, `isDetectingSchool`, `geoData` states

### Layout and Navigation

**6. `src/components/layout/DashboardLayout.tsx`**
- Remove the school switcher dropdown (both mobile and sidebar versions)
- Remove `handleSchoolSwitch`, `confirmSchoolSwitch`, `pendingSchool`, `isSwitching` state
- Remove the school switch AlertDialog
- Show fixed "SFXSAI" branding

### Enrollment

**7. `src/components/enrollment/EnrollmentWizard.tsx`**
- Remove school sync `useMemo`
- Remove MABDC validation branch
- Hardcode school to `'SFXSAI'`
- Email domain: `@sfxsai.org`

**8. `src/components/enrollment/EnrollmentForm.tsx`**
- Remove MABDC from SCHOOLS constant
- Rename STFXSA to SFXSAI

**9. `src/components/enrollment/steps/AddressInfoStep.tsx`**
- Remove `formData.school === 'MABDC'` UAE address block
- Always show Philippine Address as required (remove school conditional)

**10. `src/components/enrollment/steps/AgreementStep.tsx`**
- Update agreement text to reference only "St. Francis Xavier Smart Academy Inc (SFXSAI)"

### Students

**11. `src/hooks/useStudents.ts`**
- Remove school-based query branching
- Always filter by `'SFXSAI'` or remove school filter entirely

**12. `src/components/students/StudentTable.tsx`**
- Remove SCHOOL_FILTERS array (no multi-school filter needed)
- Remove school filter dropdown from UI

**13. `src/components/students/StudentFormModal.tsx`**
- Remove `formData.school !== 'STFXSA'` UAE address conditional
- Remove UAE address field entirely

**14. `src/components/students/StudentHoverPreview.tsx`**
- Remove MABDC UAE address display conditional

**15. `src/components/students/StudentIDCard.tsx`**
- Change fallback text from `'St. Francis Xavier'` to `'St. Francis Xavier Smart Academy Inc'`

### Admin

**16. `src/components/admin/UserManagement.tsx`**
- Remove MABDC from school options and filter
- Rename STFXSA to SFXSAI

**17. `src/components/admin/DataQualityDashboard.tsx`**
- Remove MABDC UAE address validation branch

**18. `src/components/admin/SchoolSettings.tsx`**
- Remove MABDC from school selector

### Reports and Library

**19. `src/components/reports/ReportsManagement.tsx`**
- Remove MABDC select option, rename STFXSA to SFXSAI

**20. `src/components/library/BookUploadModal.tsx`**
- Remove multi-school options; simplify to single school

**21. `src/utils/sf9Generator.ts`**
- Update hardcoded school name text

### Edge Functions

**22. `supabase/functions/create-users/index.ts`**
- Change `stfxsa` detection to `sfxsai`
- Change email domain from `@stfxsa.org` to `@sfxsai.org`

### Finance

**23. `src/utils/setupFinanceUser.ts`**
- Update `ivyan@stfxsa.org` reference to `ivyan@sfxsai.org`
- Update STFXSA references to SFXSAI

## Email Domain Decision

The email domain for LRN-based student logins will change from `@stfxsa.org` to `@sfxsai.org`. Existing users in the auth system with `@stfxsa.org` emails will need to be aware of this -- or we can keep `@stfxsa.org` as the domain if preferred. The plan assumes we switch to `@sfxsai.org` to match the new code.

## What Stays the Same
- `SchoolProvider` wrapper in App.tsx remains (context still needed by components)
- `useSchool()` hook stays (returns fixed SFXSAI values)
- `schools` table stays in database (for foreign key references)
- All academic year, grades, subjects, enrollment functionality remains intact
- MABDC data in database is untouched (just inaccessible from UI)

