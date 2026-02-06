

# Add Text Labels to View Mode Icons

## Overview

This will add visible text labels alongside the icons for the Thumbnails, Single Page View, and Two Page View buttons in the flipbook viewer toolbar, making them easier to understand at a glance.

## Current State

The toolbar currently has:
- **Thumbnails button**: Grid icon only (tooltip: "View All Pages")
- **Single Page View button**: Image icon only (tooltip: "Single Page View")  
- **Two Page View button**: Columns2 icon only (tooltip: "Two Page Spread")

These only show text when hovering (via tooltips), which isn't immediately visible.

## Changes

### File: `src/components/library/AnnotationToolbar.tsx`

| Button | Current | After |
|--------|---------|-------|
| Thumbnails | Icon only | Icon + "Thumbnails" |
| Single Page | Icon only | Icon + "1 Page" |
| Two Page | Icon only | Icon + "2 Pages" |

The buttons will be changed from icon-only (`size="icon"`) to include visible text labels while keeping the icons.

## Visual Result

```text
Before:
[ Grid Icon ] [ Image Icon ] [ Columns Icon ]

After:
[ Grid Icon Thumbnails ] [ Image Icon 1 Page ] [ Columns Icon 2 Pages ]
```

## Technical Details

- Modify the three button components in `AnnotationToolbar.tsx`
- Change `size="icon"` to `size="sm"` for proper spacing
- Add text spans after each icon with appropriate labels
- Keep existing tooltip functionality for additional context
- Maintain current styling and responsiveness

