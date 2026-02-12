

# Fix RLS Error, Simplify Agreements & Add Review Step

## Problem
The `online_registrations` table has RLS policies defined but **no GRANT permissions** for the `anon` or `authenticated` roles. Without table-level grants, all operations are rejected regardless of RLS policies.

## Changes

### 1. Database Migration -- Grant Table Permissions

```sql
GRANT SELECT, INSERT ON public.online_registrations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.online_registrations TO authenticated;
```

This allows the public registration form (which runs as `anon`) to insert rows, while the existing RLS policy (`WITH CHECK (status = 'pending')`) still enforces that only pending registrations can be created.

### 2. Simplify Step 3 -- Agreement Only

Remove from the form:
- Privacy Policy agreement and scrollable text
- Payment Terms agreement and scrollable text
- Refund Policy agreement and scrollable text
- Digital Signature canvas (`SignatureCanvas`, `sigCanvasRef`, related imports)

Keep:
- Terms and Conditions (scrollable text + checkbox)
- Minor consent checkbox (shown only when under 18)

Remove unused imports: `SignatureCanvas`, `Eraser`, `PenTool`

### 3. Add Step 4 -- Review and Submit

Convert the form from 3 steps to 4:

```text
Step 1: Student Information (unchanged)
Step 2: Parent & Address (unchanged)
Step 3: Agreement (simplified, no submit button)
Step 4: Review & Submit (new)
```

The Review step will display all entered data in a read-only summary grouped into sections:
- **Student Details**: Name, LRN, Level, Strand, Birth Date, Age, Gender, Religion, Mother Tongue, Dialects
- **Parent/Guardian**: Mother name/contact, Father name/contact, Mobile, Email, Address, Previous School
- **Agreement**: Shows checkmark for accepted terms

Each section will have an "Edit" button to jump back to the relevant step. The "Submit Registration" button appears only on this final review step.

### 4. Update State and Validation

- Remove `privacy`, `payment`, `refund` from `agreements` state (keep `terms` and `consent`)
- Remove `sigCanvasRef` and all signature-related logic
- Set `signature_data` to `null` in the insert payload
- Update `agreements_accepted` JSON to only include `terms` and `consent`
- Update `STEP_LABELS` to 4 items
- Step 2 validation: unchanged
- Step 3 validation: only `agreements.terms` (and `consent` if minor)
- Step 4: no validation needed, just submit

---

## Technical Details

| Action | File |
|--------|------|
| Migration | Grant `anon`/`authenticated` permissions on `online_registrations` |
| Modify | `src/components/registration/OnlineRegistrationForm.tsx` |

