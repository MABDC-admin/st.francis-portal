
# Add Animated Avatar to Profile Modal & Update Grid Layout

## Summary

This plan adds the animated avatar to the student profile modal header and adjusts the student card grid from 6 columns to 5 columns maximum.

## Changes Overview

| File | Change |
|------|--------|
| `StudentProfileModal.tsx` | Replace static avatar with AnimatedStudentAvatar component |
| `StudentTable.tsx` | Change grid from 6 to 5 columns max on 2xl screens |

## Technical Details

### 1. StudentProfileModal.tsx - Add Animated Avatar

Replace the static avatar in the modal header (lines 162-174) with the reusable `AnimatedStudentAvatar` component:

**Current code:**
```tsx
{student.photo_url ? (
  <img src={student.photo_url} ... />
) : (
  <div className="...">
    <span>{initials}</span>
  </div>
)}
```

**New code:**
```tsx
<AnimatedStudentAvatar
  photoUrl={student.photo_url}
  name={student.student_name}
  size="lg"
  borderColor="rgba(255,255,255,0.3)"
/>
```

This adds:
- Gentle floating animation
- Blinking eyes for non-photo avatars
- Consistent styling with other avatar instances

### 2. StudentTable.tsx - Reduce Grid to 5 Columns

Update the grid class on line 337:

**Current:**
```tsx
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6
```

**New:**
```tsx
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
```

This removes the 6-column breakpoint at `2xl`, capping at 5 columns on all larger screens. Cards will be slightly larger and easier to view.

## Visual Result

```text
Before (2xl screens):        After (2xl screens):
┌───┬───┬───┬───┬───┬───┐    ┌────┬────┬────┬────┬────┐
│ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │    │  1 │  2 │  3 │  4 │  5 │
├───┼───┼───┼───┼───┼───┤    ├────┼────┼────┼────┼────┤
│ 7 │ 8 │ 9 │...│   │   │    │  6 │  7 │  8 │  9 │ 10 │
└───┴───┴───┴───┴───┴───┘    └────┴────┴────┴────┴────┘
   (6 smaller cards)            (5 larger cards)
```

## Files to Modify

1. `src/components/students/StudentProfileModal.tsx`
   - Import AnimatedStudentAvatar
   - Replace header avatar with animated version

2. `src/components/students/StudentTable.tsx`
   - Remove `2xl:grid-cols-6` from grid class

## Implementation Order

1. Update StudentProfileModal.tsx with AnimatedStudentAvatar
2. Update StudentTable.tsx grid columns
