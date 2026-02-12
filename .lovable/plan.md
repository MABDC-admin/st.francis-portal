
# Phase 1: Redesign Online Registration System

## Overview
Rebuild the online registration form as a multi-step wizard with a public URL, add a Religion field, update address fields, include a digital signature agreement page, and show an animated success screen. This phase focuses on the core form experience without email notifications or school showcase dialog (Phase 2).

---

## 1. Public Route for Online Registration

Create a dedicated route `/register` accessible without authentication. This gives a shareable URL.

**File: `src/App.tsx`**
- Add route: `<Route path="/register" element={<PublicRegistrationPage />} />`

**New file: `src/pages/PublicRegistrationPage.tsx`**
- A standalone page wrapper (no `DashboardLayout`, no auth required)
- Renders a branded header (school logo/name) and the multi-step form
- Uses `SchoolProvider` and `AcademicYearProvider` contexts with defaults (hardcoded school, fetches current academic year)

---

## 2. Database Schema Changes

**Migration: Add columns to `online_registrations`**
```
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS religion text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS current_address text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS signature_data text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS agreements_accepted jsonb DEFAULT '{}';
```

- `religion`: new required field
- `current_address`: replaces both `phil_address` and `uae_address`
- `signature_data`: stores base64 of drawn signature (small data, acceptable for signatures)
- `agreements_accepted`: JSON object tracking which agreements were accepted and timestamps

**RLS**: The existing public INSERT policy for `online_registrations` already allows anonymous inserts. No RLS changes needed.

---

## 3. Multi-Step Registration Form

**Rewrite: `src/components/registration/OnlineRegistrationForm.tsx`**

Split into 3 steps with a progress indicator at the top.

### Step 1: Student Information
Fields (in order):
1. Grade Level (required, dropdown with grouped options)
2. LRN Toggle (Yes/No switch) + LRN input (conditional)
3. Full Name (required)
4. Birth Date (required)
5. Age (auto-calculated, read-only)
6. Gender (required, dropdown)
7. Religion (required, dropdown with common options + "Other" text input)
8. SHS Strand (conditional, only for Grade 11-12)
9. Mother Tongue
10. Dialects

### Step 2: Parent/Guardian and Address
Fields:
1. Mother's Maiden Name (required)
2. Mother's Contact Number (required)
3. Father's Name
4. Father's Contact Number
5. Parent Email
6. Current Address (required -- replaces Phil/UAE fields)
7. Previous School

### Step 3: Agreement and Signature
Content sections:
1. Terms and Conditions (scrollable text area)
2. Privacy Policy
3. Payment Terms
4. Refund Policy
5. Checkbox for each agreement (all required)
6. Parent/Guardian consent checkbox (for minors -- auto-detected from birth date)
7. Digital signature canvas (using `react-signature-canvas`, already installed)
8. Submit button

### UI Features
- Progress bar at top showing Step 1/2/3
- "Next" and "Back" navigation buttons
- Per-step validation before allowing "Next"
- Smooth framer-motion transitions between steps
- Mobile-responsive card layout
- Gradient background on the public page
- Real-time field validation (error clears on change)

---

## 4. Religion Field Options

Dropdown with these common options:
- Roman Catholic
- Islam
- Iglesia ni Cristo
- Protestant/Evangelical
- Seventh-Day Adventist
- Aglipayan
- Buddhism
- Hinduism
- Other (shows a text input when selected)

---

## 5. Digital Signature

Use `react-signature-canvas` (already in dependencies) to render a drawing pad.
- Canvas with border, clear button, and instruction text
- On submit, capture signature as base64 PNG via `toDataURL()`
- Store the base64 string in `signature_data` column (signatures are typically 5-15KB, acceptable for text storage)

---

## 6. Success Screen

After submission, show an animated confirmation:
- Animated checkmark (framer-motion scale-in)
- "Registration Submitted Successfully!" heading
- Confirmation message with next steps
- "Submit Another Registration" button to reset the form

---

## 7. Update Registration Management

**File: `src/components/registration/RegistrationManagement.tsx`**
- Update the `RegistrationRecord` interface to include `religion`, `current_address`, `signature_data`, `agreements_accepted`
- Update the detail dialog to show the new fields
- Remove references to `uae_address`, use `current_address` instead

---

## 8. Files Summary

| Action | File |
|--------|------|
| Create | `src/pages/PublicRegistrationPage.tsx` |
| Rewrite | `src/components/registration/OnlineRegistrationForm.tsx` |
| Modify | `src/components/registration/RegistrationManagement.tsx` |
| Modify | `src/App.tsx` (add `/register` route) |
| Migration | Add `religion`, `current_address`, `signature_data`, `agreements_accepted` columns |

---

## Technical Notes

- The form will auto-detect the current academic year by querying `academic_years` where `is_current = true`
- School ID will be determined from a URL parameter or default to the primary school
- No authentication is required for the `/register` page
- The existing RLS policy allowing public inserts on `online_registrations` will be used
- `react-signature-canvas` is already installed (v1.1.0-alpha.2)
- Validation uses inline error state (no zod for this simple form to match existing patterns)
