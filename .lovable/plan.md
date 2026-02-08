

# Fix Duplicate Student Avatar in Student Portal

## Problem
The Student Portal shows two large photo avatars when on the Dashboard tab:
1. One in the main header (StudentPortal.tsx, line 549) -- size "4xl" (192x192px)
2. Another inside the Dashboard content (StudentDashboard.tsx, line 86) -- also size "4xl" (192x192px)

## Changes

### 1. Reduce the header avatar size by 50%
**File:** `src/components/portals/StudentPortal.tsx`
- Change the `AnimatedStudentAvatar` size from `"4xl"` to `"2xl"` (from h-48/w-48 down to h-32/w-32, roughly 50% reduction)

### 2. Remove the duplicate avatar from the Dashboard tab
**File:** `src/components/portals/student/StudentDashboard.tsx`
- Remove the "Student Avatar Header" block (lines 83-97) that renders a second `AnimatedStudentAvatar` with name and grade level, since this info is already shown in the portal header above

