
# Fix Annotation Alignment + Enhanced Mobile Thumbnail View

## Issues to Fix

### 1. Mouse Pointer Alignment Problem

**Root Cause**: The canvas coordinate calculation doesn't account for the mismatch between:
- The CSS `transform: scale(zoom)` on the parent container
- The canvas's internal pixel dimensions
- The actual rendered image size in the DOM

**Current Flow (Broken)**:
```text
Container has: transform: scale(zoom)
Canvas has: width/height = imageSize * zoom (internal pixels)
Canvas CSS: inset-0, w-full, h-full (stretches to match image)

When clicking:
- getBoundingClientRect() returns scaled dimensions
- Dividing by zoom doesn't correctly map to canvas internal coords
```

**Solution**: Use the image's actual displayed dimensions (clientWidth/clientHeight) instead of natural dimensions, and properly account for the CSS transform scaling.

### 2. Thumbnail Grid Layout

| Device | Current | New |
|--------|---------|-----|
| Mobile (<768px) | 2 columns | 3 columns |
| Tablet (768px-1024px) | 2 columns | 4 columns |

### 3. Thumbnail Icon Position

Current order: `[Grid Icon] [Prev] [Page Count] [Next]`
New order: `[Prev] [Page Count] [Next] [Animated Grid Icon]`

### 4. Jumping Animation

Add a subtle "bounce" animation that triggers every 5 seconds using CSS keyframes + a JavaScript interval to toggle the animation class.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAnnotations.ts` | Fix coordinate calculation to use displayed image size |
| `src/components/library/FlipbookViewer.tsx` | Update thumbnail grid, move icon, add animation |
| `src/index.css` | Add bounce/jump keyframe animation |

---

## Technical Changes

### 1. Fix `useAnnotations.ts` - Coordinate Calculation

The `getCanvasCoordinates` function needs to properly map mouse position to canvas internal coordinates:

```tsx
// Current (broken):
const getCanvasCoordinates = (e, zoom) => {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) / zoom,
    y: (e.clientY - rect.top) / zoom,
  };
};

// Fixed: Account for canvas internal dimensions vs displayed size
const getCanvasCoordinates = (e, zoom) => {
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  
  // Map from displayed size to internal canvas coordinates
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  
  return {
    x: ((e.clientX - rect.left) * scaleX) / zoom,
    y: ((e.clientY - rect.top) * scaleY) / zoom,
  };
};
```

### 2. Update `FlipbookViewer.tsx`

**Thumbnail Grid Classes**:
```tsx
// Current:
<div className="grid grid-cols-2 gap-3 p-3">

// New - Responsive columns:
<div className="grid grid-cols-3 md:grid-cols-4 gap-3 p-3">
```

**Mobile Navigation Reorder**:
```tsx
// Current order:
[LayoutGrid] [Prev] [count] [Next]

// New order:
[Prev] [count] [Next] [LayoutGrid with animation]
```

**Add Animation State**:
```tsx
const [isJumping, setIsJumping] = useState(false);

useEffect(() => {
  const interval = setInterval(() => {
    setIsJumping(true);
    setTimeout(() => setIsJumping(false), 500);
  }, 5000);
  return () => clearInterval(interval);
}, []);
```

**Apply Animation Class**:
```tsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowMobileThumbnails(true)}
  className={cn(isJumping && 'animate-bounce-subtle')}
>
  <LayoutGrid className="h-4 w-4" />
</Button>
```

### 3. Add Animation to `index.css`

```css
@keyframes bounce-subtle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.animate-bounce-subtle {
  animation: bounce-subtle 0.5s ease-in-out;
}
```

---

## Updated Mobile Navigation Layout

```text
Before:
+--------------------------------------------------+
| [Grid] [< Prev]  3/20  [Next >]                  |
+--------------------------------------------------+

After:
+--------------------------------------------------+
| [< Prev]  3/20  [Next >]  [Grid (bouncing)]      |
+--------------------------------------------------+
```

---

## Summary

| Change | Description |
|--------|-------------|
| Fix alignment | Correct coordinate mapping in useAnnotations.ts |
| 3 columns mobile | `grid-cols-3` for screens < 768px |
| 4 columns tablet | `md:grid-cols-4` for screens >= 768px |
| Icon position | Move LayoutGrid button to right of "Next" |
| Bounce animation | CSS keyframe + 5-second interval trigger |
