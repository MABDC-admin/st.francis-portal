

# Map Registration Details to Visits Tab with Fallbacks

## Problem
All existing visit records have `registration_id = null`, so the Student, Grade Level, Age, Address, and Mobile No. columns all show "---". Only future visits created through the registration flow will be linked.

## Solution
Update the Visits tab to gracefully handle both linked and unlinked visits by falling back to the visit record's own fields when no registration is linked.

### File: `src/components/registration/RegistrationManagement.tsx`

**1. Update the query to also fetch visitor_phone and visitor_email (line 97)**

Current:
```
.select('*, online_registrations(student_name, level, current_address, phil_address, birth_date, mobile_number)')
```
Add `visitor_phone, visitor_email` -- these are already columns on `school_visits` but weren't being used.

**2. Update table cell rendering (lines 352-387)**

For each column, add a fallback so unlinked visits still show useful data:

| Column | Linked (has registration) | Unlinked (no registration) |
|--------|--------------------------|---------------------------|
| Visitor | `v.visitor_name` | `v.visitor_name` (same) |
| Date | `v.visit_date` | `v.visit_date` (same) |
| Slot | `v.visit_slot` | `v.visit_slot` (same) |
| Student | `online_registrations.student_name` | `v.visitor_name` (fallback) |
| Grade Level | `online_registrations.level` | "---" |
| Age | Calculated from `birth_date` | "---" |
| Address | `online_registrations.current_address` or `phil_address` | "---" |
| Mobile No. | `online_registrations.mobile_number` | `v.visitor_phone` (fallback) |
| Status | `v.status` | `v.status` (same) |
| Actions | Same | Same |

This way:
- Existing unlinked visits show the visitor's name and phone in the Student and Mobile columns
- New visits created through the registration flow show full student details
- No data is lost or hidden

This is a small change to 2 lines in the rendering logic and 1 line in the query.
