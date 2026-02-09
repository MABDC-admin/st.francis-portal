

# Improve Grade Level Assignment for Teachers

## Current State

The grade level assignment feature **already exists** in the Teacher Management page (accessible from the Admin sidebar under "Teachers"). When you click "Add Teacher" or the Edit button on any teacher row, there's a "Grade Level" field in the modal form.

**However**, it's currently a plain text input where you type freely (e.g., "Grade 6"). This is error-prone and inconsistent with the rest of the app, which uses standardized dropdown selectors for grade levels.

## Proposed Improvements

### 1. Replace free-text input with a proper Grade Level dropdown

Convert the "Grade Level" field in the Add/Edit Teacher modal from a plain `Input` to a `Select` dropdown with all standard levels:

```
Kinder 1, Kinder 2, Grade 1-6, Grade 7-12
```

This matches the grade level selectors used throughout the rest of the application (Attendance, Schedules, Assignments, etc.).

### 2. Add a quick "Assign Grade Level" action button in the teacher table

Add a dedicated action button (graduation cap icon) in each teacher's row that opens a small dialog to quickly assign/change a grade level without opening the full edit form. This makes bulk assignment faster.

## Files to Edit

**`src/components/teachers/TeacherManagement.tsx`**:
- Replace the grade level `Input` (line 354-358) with a `Select` component using the standard `GRADE_LEVELS` array
- Add a "Quick Assign Grade Level" button in the Actions column alongside Edit and Delete
- Add a small dialog for the quick-assign flow that shows the teacher name and a grade level dropdown
- Add the `GraduationCap` icon import from lucide-react

## Where to Find It

As an Admin, go to the sidebar and click **Teachers** -- the teacher list table shows all teachers with their current grade level. You can:
- Click **Edit** on any teacher to change their grade level in the full form
- (New) Click the **graduation cap** icon to quickly assign a grade level

No database changes are needed -- the `grade_level` column already exists on the `teachers` table.
