

# Add Logout Button to Student Portal Sidebar

## What Changes

Add a "Sign Out" button below the "Announcements" menu item in the student portal sidebar, with vertical spacing equivalent to 4 menu items gap.

## Technical Details

### File: `src/components/layout/DashboardLayout.tsx`

**Update the student menu items array (around line 479-481):**

After the `student-announcements` entry, add a spacer and a logout item. Since the menu items are rendered as a list, the cleanest approach is to add a special "spacer" entry followed by a logout entry with a unique id (e.g., `'logout'`).

However, since menu items trigger `onTabChange`, a simpler approach is to handle this in the sidebar rendering logic. The plan:

1. In the `getMenuItems` function for the `'student'` case (~line 480), add a spacer object and a logout item after `student-announcements`:
   ```typescript
   { id: 'spacer', icon: null, label: '', isSpacer: true },
   { id: 'logout', icon: LogOutIcon, label: 'Sign Out', isLogout: true },
   ```

2. In the sidebar rendering section where menu items are mapped, add handling for:
   - `isSpacer`: render a `div` with `mt-16` (approximately 4 menu-item heights of gap)
   - `isLogout`: render a styled logout button that calls `signOut` instead of `onTabChange`

This follows the existing sign-out button pattern already used in the sidebar footer but places a dedicated one in the student menu for better visibility.

**Alternative simpler approach:** Instead of modifying the menu items system, insert a dedicated logout button specifically when `role === 'student'` in the sidebar content area, positioned after the menu items with `mt-16` spacing. This avoids changing the menu item type system.

The simpler approach will be used:
- After the menu items loop for students, render a logout button with `mt-16` (4 menu gaps) spacing
- Style it consistently with the existing sidebar logout button (red text, LogOut icon)
- This keeps the menu items array clean and avoids type changes

### Files Modified
- `src/components/layout/DashboardLayout.tsx` -- Add a student-specific logout button after menu items with spacing
