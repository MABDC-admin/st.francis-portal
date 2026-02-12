

# Auto-Play Photo Gallery + Auto-Close After Visit Booking

## Changes

### 1. Auto-rotating photo gallery in SchoolShowcaseDialog
Add a `useEffect` interval that automatically cycles through gallery photos every 4 seconds. The auto-play pauses when the user manually interacts (clicks arrows or dots) and resumes after a short delay.

**File:** `src/components/registration/SchoolShowcaseDialog.tsx`
- Add a `useEffect` with `setInterval` to call `nextPhoto()` every 4 seconds
- Add a pause mechanism: when user clicks prev/next/dot, pause auto-play for 8 seconds before resuming
- Clean up interval on unmount

### 2. Auto-close dialog after visit is scheduled
After the visit is successfully booked, automatically close the entire dialog after a 3-second delay so the user sees the confirmation briefly before it closes.

**File:** `src/components/registration/VisitScheduler.tsx`
- Add an `onClose` prop to the `VisitSchedulerProps` interface
- After `setIsBooked(true)`, start a `setTimeout` of 3 seconds that calls `onClose()`
- Clean up timeout on unmount

**File:** `src/components/registration/SchoolShowcaseDialog.tsx`
- Pass `onClose={() => onOpenChange(false)}` to the `VisitScheduler` component

## Technical Details

### Auto-play gallery (SchoolShowcaseDialog)
```typescript
// Add useEffect for auto-rotation
const [autoPaused, setAutoPaused] = useState(false);

useEffect(() => {
  if (!hasPhotos || photos.length <= 1 || autoPaused) return;
  const interval = setInterval(nextPhoto, 4000);
  return () => clearInterval(interval);
}, [hasPhotos, photos.length, nextPhoto, autoPaused]);

// On manual interaction, pause briefly
const pauseAutoPlay = () => {
  setAutoPaused(true);
  setTimeout(() => setAutoPaused(false), 8000);
};
```

### Auto-close visit scheduler (VisitScheduler)
```typescript
// Add onClose prop
interface VisitSchedulerProps {
  schoolId: string;
  registrationId?: string;
  onBack: () => void;
  onClose?: () => void;  // new
}

// After booking success, auto-close after 3s
useEffect(() => {
  if (!isBooked || !onClose) return;
  const timer = setTimeout(onClose, 3000);
  return () => clearTimeout(timer);
}, [isBooked, onClose]);
```

### Pass onClose from SchoolShowcaseDialog
```tsx
<VisitScheduler
  schoolId={schoolId}
  registrationId={registrationId}
  onBack={() => setShowVisitScheduler(false)}
  onClose={() => onOpenChange(false)}
/>
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/registration/SchoolShowcaseDialog.tsx` | Add auto-play interval for gallery, pass `onClose` to VisitScheduler |
| `src/components/registration/VisitScheduler.tsx` | Add `onClose` prop, auto-close dialog 3s after successful booking |

