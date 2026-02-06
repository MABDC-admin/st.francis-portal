
# Remove Redundant "My Profile" Sidebar Item for Students

## The Problem

The student portal currently has **duplicate navigation** for "My Profile":

| Location | Items |
|----------|-------|
| **Sidebar** | Portal Home, My Profile, Library |
| **StudentPortal Tabs** | My Profile, My Grades, My Subjects, Announcements |

This creates confusion because:
1. "My Profile" in the sidebar doesn't lead anywhere useful (no handler in Index.tsx)
2. "My Profile" tab already exists inside the StudentPortal
3. Students don't need two different ways to access the same content

## The Solution

Remove "My Profile" from the sidebar navigation for students. The StudentPortal component already has comprehensive tabbed navigation including profile, grades, subjects, and announcements.

### After the Change

| Location | Items |
|----------|-------|
| **Sidebar** | Portal Home, Library |
| **StudentPortal Tabs** | My Profile, My Grades, My Subjects, Announcements |

## Technical Changes

### File: `src/components/layout/DashboardLayout.tsx`

Update the student navigation items in the `getNavItemsForRole` function:

**Before (lines 188-193):**
```typescript
case 'student':
  return [
    ...baseItems,
    { id: 'profile', icon: ProfileIcon3D, label: 'My Profile' },
    { id: 'library', icon: LibraryIcon3D, label: 'Library' },
  ];
```

**After:**
```typescript
case 'student':
  return [
    ...baseItems,
    { id: 'library', icon: LibraryIcon3D, label: 'Library' },
  ];
```

## Result

Students will see a clean, non-redundant sidebar with just:
- **Portal Home** - Opens the StudentPortal with tabs for Profile, Grades, Subjects, Announcements
- **Library** - Opens the grade-filtered library

The comprehensive student experience remains intact through the StudentPortal tabs, which is the proper place for these features.
