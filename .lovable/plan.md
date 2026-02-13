

# Fix: Show Visitor Details When No Registration is Linked

## Problem
The code change to show student details is working correctly, but all existing visit records have `registration_id = null` (they were not created through the registration flow). This means the `online_registrations` join returns `null`, and the Student column shows "---".

## Solution
Update the Student column to fall back to showing the visitor's own details (`visitor_name`, `visitor_phone`) when there is no linked registration. This way, every visit row will show useful information regardless of whether it was linked to a registration or not.

### File: `src/components/registration/RegistrationManagement.tsx`

**Update the Student cell rendering (around line 352):**
- When `online_registrations` exists: show student name, grade, address, age, and contact (current behavior)
- When `online_registrations` is null: show the visitor's name and phone number from the visit record itself (`visitor_name`, `visitor_phone`)

```
Student Column Logic:
  IF registration is linked:
    -> Student Name (bold)
    -> Grade Level
    -> Address
    -> Age
    -> Contact Number
  ELSE:
    -> Visitor Name (bold)
    -> Visitor Phone (if available)
    -> Small label: "No linked registration"
```

This is a single-line change to the fallback case in the table cell.
