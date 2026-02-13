

# Fill Grade Level, Age, and Address for All Visits

## Problem
The `school_visits` table has no columns for grade level, birth date, or address. These fields only exist on `online_registrations`. All existing visit records are unlinked (`registration_id = null`), so those columns always show "---".

## Solution
Add `visitor_level`, `visitor_birth_date`, and `visitor_address` columns directly to `school_visits`. This way:
- New visits created through the registration flow will populate these fields from the registration data
- Old unlinked visits will still show "---" (no data available), but future visits will always have data regardless of linking

## Changes

### 1. Database Migration
Add three nullable columns to `school_visits`:
- `visitor_level` (text) -- stores grade level
- `visitor_birth_date` (date) -- stores birth date for age calculation
- `visitor_address` (text) -- stores address

### 2. File: `src/components/registration/OnlineRegistrationForm.tsx`
Update the `school_visits` insert inside `handleSubmit` to also save:
- `visitor_level` from form data (`level`)
- `visitor_birth_date` from form data (`birthDate`)
- `visitor_address` from form data (`currentAddress` or `philAddress`)

### 3. File: `src/components/registration/RegistrationManagement.tsx`
Update the three table cells to add fallbacks to the new visit-level columns:

| Column | Priority 1 (linked registration) | Priority 2 (visit record) | Priority 3 |
|--------|----------------------------------|--------------------------|------------|
| Grade Level | `online_registrations.level` | `v.visitor_level` | "---" |
| Age | Calculated from `online_registrations.birth_date` | Calculated from `v.visitor_birth_date` | "---" |
| Address | `online_registrations.current_address` / `phil_address` | `v.visitor_address` | "---" |

This ensures all future visits have complete data in every column, while existing unlinked visits gracefully show "---".
