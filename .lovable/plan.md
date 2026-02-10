

# Move Learner Form into Admissions + STFXSA Address Fix

## Summary

Replace the simple "New Application" dialog in AdmissionsPage with the full multi-step EnrollmentWizard (the "New Learner" form), so that for STFXSA the enrollment flow lives inside Admissions. Also fix the STFXSA form to show only Philippine Address (no UAE Address), fix RLS policies, and clean up navigation.

## Changes

### 1. AdmissionsPage.tsx -- Replace inline dialog with EnrollmentWizard

Currently the "New Application" button opens a basic dialog with flat input fields. Instead:

- Replace the `showAddDialog` state with a `showWizard` boolean
- When `showWizard` is true, render a full-screen Dialog containing the `EnrollmentWizard` component (modified to accept a `mode` prop)
- On successful enrollment from the wizard, also insert a row into the `admissions` table with status `'approved'` (since it was created directly by Registrar/Admin) and close the wizard
- Alternatively (simpler approach): Replace the simple dialog form with the existing EnrollmentWizard component embedded directly, using a `submitToAdmissions` prop that inserts into `admissions` table instead of `students` table, with status `'pending'`

**Chosen approach**: Embed the EnrollmentWizard inside AdmissionsPage's dialog. Add a prop `onAdmissionSubmit` to EnrollmentWizard that, when provided, submits to the `admissions` table instead of `students`. This keeps the multi-step wizard experience (Student Info, Parent Info, Address, Agreement) for new applications.

### 2. AddressInfoStep.tsx -- Fix STFXSA address fields

Currently STFXSA shows Philippine Address and MABDC shows UAE Address. This is already correct per the existing code. But the user wants to confirm UAE address is NOT shown for STFXSA. The current code already handles this correctly:
- `formData.school === 'STFXSA'` shows Phil Address
- `formData.school === 'MABDC'` shows UAE Address

No change needed here unless the form is not receiving the correct `school` value. Will verify and ensure `school` is always set from context.

### 3. DashboardLayout.tsx -- Remove "New Learner" nav item for STFXSA

Since the learner form is now inside Admissions for STFXSA, remove the standalone "New Learner" (`enrollment`) nav item from the sidebar for both Admin and Registrar roles, or conditionally hide it when school is STFXSA (keeping it for MABDC if needed).

**Decision**: Remove the `enrollment` nav item entirely since all new applications should go through Admissions. The enrollment wizard will be accessible via the "New Application" button inside Admissions.

### 4. RLS Policy Fixes

Current RLS policies look correct -- both Admin and Registrar can SELECT, INSERT, UPDATE on `admissions` and INSERT/SELECT on `admission_audit_logs`. No DELETE policy exists (by design for audit trail). No fixes needed.

### 5. Index.tsx -- Remove standalone enrollment tab rendering

Remove or keep the `enrollment` tab rendering as a fallback. Since the wizard will now be inside AdmissionsPage, the standalone tab is no longer the primary entry point.

**Decision**: Keep the enrollment tab rendering as-is for backward compatibility but remove the nav item so users enter through Admissions instead.

## Technical Details

### File: `src/components/admissions/AdmissionsPage.tsx`
- Replace the simple "New Application" dialog with a full-width Dialog that renders `EnrollmentWizard`
- Pass a callback prop (`onAdmissionSubmit`) to EnrollmentWizard that:
  1. Inserts into `admissions` table with status `'pending'`
  2. Logs to `admission_audit_logs`
  3. Closes the dialog and refreshes the admissions list
- Remove the inline `newAdmission` state and simple form fields

### File: `src/components/enrollment/EnrollmentWizard.tsx`
- Add optional props: `mode?: 'enrollment' | 'admission'` and `onComplete?: () => void`
- When `mode === 'admission'`:
  - Submit to `admissions` table instead of `students` table
  - Skip credential creation and QR code generation
  - Skip email sending (handled on approval)
  - Call `onComplete()` after successful submission
- Default mode remains `'enrollment'` for backward compatibility

### File: `src/components/enrollment/steps/AddressInfoStep.tsx`
- Already correctly shows Phil Address for STFXSA and UAE Address for MABDC
- No changes needed (verified)

### File: `src/components/layout/DashboardLayout.tsx`
- Remove `{ id: 'enrollment', icon: EnrollmentIcon3D, label: 'New Learner' }` from both admin and registrar menu items
- The enrollment wizard is now accessed via "New Application" button in Admissions

### File: `src/pages/Index.tsx`
- Keep existing `enrollment` tab rendering as fallback (no visible nav item points to it)

### Database / RLS
- No additional migration needed -- existing RLS policies are correct for Admin and Registrar roles

