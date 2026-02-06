

# Fix Flip Animation and Emoji Drag-and-Drop

## Overview

This plan addresses two issues in the Flipbook Viewer:

1. **Mobile Flip Animation**: The mobile/single-page view lacks page-turn animation when navigating. Currently, pages just appear instantly without any transition effect.

2. **Emoji Drag-and-Drop Not Working**: Stickers/emojis cannot be dragged from the picker and dropped onto the book page. The drag-and-drop handlers exist but the canvas isn't properly receiving drop events.

---

## Issue Analysis

### Issue 1: Missing Mobile Flip Animation

**Current State** (lines 503-531 in FlipbookViewer.tsx):
```text
Mobile view renders a simple <div> with scale transform:
├── No AnimatePresence wrapper
├── No motion.div animation
├── Page changes happen instantly
└── No visual feedback during navigation
```

**Desktop State** (lines 444-502):
```text
Desktop spread uses framer-motion:
├── AnimatePresence with mode="wait"
├── motion.div with rotateY, opacity, scale
├── 3D perspective flip effect
└── Smooth 300ms transitions
```

### Issue 2: Drag-and-Drop Not Working

**Root Causes Identified**:

| Problem | Location | Description |
|---------|----------|-------------|
| No pointer-events on canvas | Line 518-530 | Canvas only sets cursor style, no explicit `pointer-events: auto` |
| Canvas behind image in stacking | Line 518 | Canvas is `absolute inset-0` but may not intercept drag events |
| Missing dragover/drop propagation | Lines 284-312 | Drop handler exists but canvas isn't receiving events |
| Popover closes before drag completes | AnnotationToolbar.tsx | Popover may close on mousedown, canceling the drag |

The main issue is that when dragging from the Popover, the Popover closes (unmounts) before the drop completes, which cancels the drag operation entirely.

---

## Implementation Plan

### Step 1: Add Mobile Page Flip Animation

Update `src/components/library/FlipbookViewer.tsx`:

Add an `AnimatePresence` wrapper and `motion.div` to the mobile/tablet single-page view with a page-flip animation:

```text
Changes to mobile view (lines 503-531):
├── Wrap with <AnimatePresence mode="wait">
├── Replace <div> with <motion.div key={currentPage}>
├── Add slide/flip animation variants:
│   ├── initial: opacity 0, x offset based on direction
│   ├── animate: opacity 1, x 0
│   └── exit: opacity 0, x offset opposite direction
├── Track navigation direction (prev/next)
└── Apply 250ms transition with easeInOut
```

**Animation Style Options**:
- **Slide**: Pages slide left/right like a carousel
- **Flip**: 3D rotation like turning a physical page
- **Fade-Slide**: Combination of opacity and slight horizontal movement

Recommended: **Slide animation** for mobile (simpler, more performant) and **3D flip** for desktop (already exists).

### Step 2: Fix Drag-and-Drop - Keep Popover Open During Drag

Update `src/components/library/AnnotationToolbar.tsx`:

The Popover closes when you start dragging because it detects the mousedown/pointer event as an outside click. We need to prevent it from closing during drag operations.

```text
Changes to AnnotationToolbar.tsx:
├── Add state: isDragging to track drag operation
├── Pass onDragStart to StickerPicker to set isDragging=true
├── Use Popover's modal prop or onInteractOutside
├── Prevent close during drag: onInteractOutside={(e) => isDragging && e.preventDefault()}
└── Reset isDragging on dragend (via window event listener)
```

### Step 3: Ensure Canvas Receives Drop Events

Update `src/components/library/FlipbookViewer.tsx`:

```text
Changes to canvas element:
├── Add explicit style={{ pointerEvents: 'auto' }}
├── Ensure canvas is above image in z-index
├── Add visual drop feedback (optional):
│   ├── Track isDragOver state
│   └── Add border/highlight when dragging over
└── Ensure onDragOver calls e.preventDefault() (already exists)
```

### Step 4: Update StickerPicker to Support Drag Callbacks

Update `src/components/library/StickerPicker.tsx`:

Pass through drag event handlers to child components:

```text
Changes:
├── Add onDragEnd prop to interface
├── Pass onDragEnd to OpenMojiPicker, FluentEmojiPicker, IconSearch
├── Each picker calls onDragEnd when drag ends
└── This signals to parent that popover can close
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/library/FlipbookViewer.tsx` | Modify | Add mobile flip animation, fix canvas drop handling |
| `src/components/library/AnnotationToolbar.tsx` | Modify | Keep popover open during drag operations |
| `src/components/library/StickerPicker.tsx` | Modify | Add drag event callbacks |
| `src/components/library/OpenMojiPicker.tsx` | Modify | Add onDragEnd callback |
| `src/components/library/FluentEmojiPicker.tsx` | Modify | Add onDragEnd callback |
| `src/components/library/IconSearch.tsx` | Modify | Add onDragEnd callback |

---

## Technical Details

### Mobile Flip Animation Implementation

```typescript
// Track navigation direction
const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

// Update direction when navigating
const goToNext = () => {
  setSlideDirection('right');
  setCurrentPage(p => Math.min(pages.length, p + 1));
};

const goToPrev = () => {
  setSlideDirection('left');
  setCurrentPage(p => Math.max(1, p - 1));
};

// Animation variants
const slideVariants = {
  enter: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: 'left' | 'right') => ({
    x: direction === 'right' ? -100 : 100,
    opacity: 0,
  }),
};

// In JSX
<AnimatePresence mode="wait" custom={slideDirection}>
  <motion.div
    key={currentPage}
    custom={slideDirection}
    variants={slideVariants}
    initial="enter"
    animate="center"
    exit="exit"
    transition={{ duration: 0.25, ease: 'easeInOut' }}
  >
    {/* Page content */}
  </motion.div>
</AnimatePresence>
```

### Popover Drag Fix Implementation

```typescript
// In AnnotationToolbar
const [isDragging, setIsDragging] = useState(false);

// Global dragend listener to reset state
useEffect(() => {
  const handleDragEnd = () => setIsDragging(false);
  window.addEventListener('dragend', handleDragEnd);
  return () => window.removeEventListener('dragend', handleDragEnd);
}, []);

<Popover>
  <PopoverContent 
    onInteractOutside={(e) => {
      if (isDragging) {
        e.preventDefault();
      }
    }}
  >
    <StickerPicker 
      onSelect={handleStickerSelect}
      onDragStart={() => setIsDragging(true)}
    />
  </PopoverContent>
</Popover>
```

### Canvas Drop Zone Enhancement

```typescript
// Add visual feedback during drag
const [isDragOver, setIsDragOver] = useState(false);

const handleDragEnter = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(true);
};

const handleDragLeave = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragOver(false);
  // ... existing drop logic
};

<canvas
  className={cn(
    'absolute inset-0 w-full h-full z-10',
    isDragOver && 'ring-2 ring-primary ring-inset'
  )}
  style={{ pointerEvents: 'auto' }}
  onDragEnter={handleDragEnter}
  onDragOver={handleDragOver}
  onDragLeave={handleDragLeave}
  onDrop={handleDrop}
/>
```

---

## Expected Behavior After Fix

### Mobile Flip Animation
1. User taps "Next" button
2. Current page slides out to the left with fade
3. New page slides in from the right with fade
4. Animation duration: 250ms
5. Works for both Next and Previous navigation

### Drag-and-Drop Stickers
1. User opens Stickers popover
2. User drags emoji/icon from picker
3. Popover stays open during drag
4. User drops sticker onto book page
5. Canvas shows visual feedback (ring) during drag over
6. Sticker appears at drop location
7. Popover can then be closed manually

---

## Benefits

1. **Better UX**: Smooth page transitions make the reader feel more like a physical book
2. **Intuitive Interaction**: Drag-and-drop is a natural way to place stickers
3. **Visual Feedback**: Users see clearly where stickers will be placed
4. **Cross-Platform**: Works on both desktop and mobile/tablet views

