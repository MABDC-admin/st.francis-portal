

# Separate Student Details into Individual Table Columns

## Overview
Restructure the Visits table to display student details in separate columns instead of stacking them all inside a single "Student" cell. Since all visitors registered through the online registration flow, every record should be linked.

## Changes

### File: `src/components/registration/RegistrationManagement.tsx`

**1. Update table headers (lines 337-344)**
Replace the current 6-column header with 10 columns:
- Visitor
- Date
- Slot
- Student
- Grade Level
- Age
- Address
- Mobile No.
- Status
- Actions

**2. Update table body cells (lines 348-400)**
Break the stacked student info out of the single "Student" cell into individual cells:

| Column | Source |
|--------|--------|
| Visitor | `v.visitor_name` |
| Date | `v.visit_date` |
| Slot | `v.visit_slot` |
| Student | `v.online_registrations?.student_name` or "---" |
| Grade Level | `v.online_registrations?.level` or "---" |
| Age | Calculated from `v.online_registrations?.birth_date` or "---" |
| Address | `v.online_registrations?.current_address` or `phil_address` or "---" |
| Mobile No. | `v.online_registrations?.mobile_number` or "---" |
| Status | `v.status` badge |
| Actions | Complete/Cancel buttons (unchanged) |

**3. Remove the fallback "No linked registration" block**
Since all visitors are linked to registrations, simplify the rendering by using optional chaining with a "---" fallback for each field.

The data query (line 97) already fetches all needed fields and requires no changes.

