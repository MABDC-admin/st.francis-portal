

# Remove Photo Avatar from Student Portal Pages

## Change

**File:** `src/components/portals/StudentPortal.tsx`

Remove the `AnimatedStudentAvatar` block (lines 548-555) from the header section. The student name and section title will remain -- only the avatar image is removed.

The header will keep its layout with just the text (page title + subtitle) and the logout button on the right side.

