

# Add Learner Records Menu to Teacher Sidebar

## Problem

Admin and Registrar roles have a **"Learner Records"** collapsible group in their sidebar containing items like "Learners", "LIS", and "Attendance". The Teacher role has **no equivalent** -- teachers currently cannot navigate to learner lists from their sidebar at all.

## Proposed Change

Add a **"Learner Records"** group to the Teacher's sidebar, with a subset of items appropriate for their role:

### Updated Teacher Sidebar Structure

```text
Portal Home
My Info
  |-- Profile
Learner Records        (NEW group)
  |-- Learners         (NEW - view assigned students)
Academics
  |-- Grades
  |-- Subjects
  |-- Subject Enrollment
  |-- Attendance
  |-- Schedules
  |-- Assignments
  |-- Exams
Messages
...
```

Teachers get the "Learners" item to view student lists (filtered by their assignments). Items like "LIS", "New Learner", and "Import CSV" are excluded since those are administrative functions.

## File to Edit

**`src/components/layout/DashboardLayout.tsx`** (around line 370) -- Insert a new collapsible group before the `academics` group in the teacher's menu:

```typescript
{
  id: 'student-records',
  icon: StudentIcon3D,
  label: 'Learner Records',
  isCollapsible: true,
  items: [
    { id: 'students', icon: StudentIcon3D, label: 'Learners' },
  ]
},
```

This is a single small edit with no database or backend changes required.
