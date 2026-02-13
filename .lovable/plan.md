
# Fix Student Column in Visits Tab

## Problem
The Student column in the Visits tab displays the **parent's name** (e.g., Father Name) instead of the **student's name**. This happens because:
1. The `visitor_name` field is pre-filled from `mother_maiden_name` or `father_name`
2. The Student column falls back to `visitor_name` when no linked registration exists

## Solution

### 1. Database Migration
Add a `visitor_student_name` column (text, nullable) to the `school_visits` table to store the student's name directly.

### 2. File: `src/components/registration/OnlineRegistrationForm.tsx`
Update the `school_visits` insert to also save:
- `visitor_student_name` from `formData.student_name`

### 3. File: `src/components/registration/RegistrationManagement.tsx`
Update the Student column fallback chain:
- **Before:** `v.online_registrations?.student_name || v.visitor_name || '---'`
- **After:** `v.online_registrations?.student_name || v.visitor_student_name || '---'`

This keeps `visitor_name` for the Visitor column (correctly showing the parent) and uses `visitor_student_name` for the Student column (correctly showing the student).
