
## Transform Assignment Card UI to Match Reference Design

### What Changes

The `AssignmentCard` component inside `src/components/portals/student/StudentAssignmentsTab.tsx` will be fully redesigned to match the reference image style. The tab/filter structure and data logic stay the same — only the visual card design changes.

---

### Reference Image Analysis

The reference card has these visual elements:
- **Red/terracotta header band** across the top of the card with a book icon on the left and a "Due in X days" pill badge on the right
- **Subject badge** (e.g. "✓ English") shown as a small green-tinted chip in the header band
- **Title** in bold white text inside the header band
- **Light body** area below — off-white/cream background
- **Description preview** text on the left with a date (e.g. "Apr 15") on the right
- **"View Details" text link** on bottom-left and a styled **"View Details" button** on bottom-right
- **Rounded corners** throughout; card has soft shadow

---

### New Card Layout

```
┌─────────────────────────────────────────────┐
│ [📖]  Creative Writing Assignment  [Due 4d] │  ← red/warm header band
│       ✓ English                             │
├─────────────────────────────────────────────┤
│  Write a story on a topic of your choice.  Apr 15  │  ← body
│                                             │
│  View Details              [View Details]   │  ← footer row
└─────────────────────────────────────────────┘
```

---

### Technical Implementation Plan

**File to modify:** `src/components/portals/student/StudentAssignmentsTab.tsx`

**Only the `AssignmentCard` component is rewritten.** The tab structure, filters, summary bubbles, and all logic remain unchanged.

#### New `AssignmentCard` design:

1. **Card container** — `rounded-2xl overflow-hidden shadow-md` with a white/cream body, no border. Uses `cursor-pointer` and `active:scale-95` for tap feedback.

2. **Header band** — Full-width colored top section (~80px tall):
   - Background: warm red `bg-[#C0392B]` or `bg-rose-700` (matching reference). Overdue uses `bg-rose-800`.
   - Left: book icon in a slightly lighter circle
   - Center: assignment title in white bold text + subject badge chip below (green checkmark + subject name)
   - Right: "Due in X days" pill — rounded, cream/yellow background, dark text

3. **Body** — Cream/off-white background `bg-[#FDF6EC]`:
   - Description preview (first 60 chars of `description` or a placeholder) on the left
   - Due date formatted as "MMM D" on the right in muted text

4. **Footer row** — Subtle separator, then:
   - Left: "View Details" text link in muted color
   - Right: Outlined/filled "View Details" button in warm yellow/cream style

5. **Status overlay** — For submitted/graded cards, the "Due in X days" pill becomes a status badge (e.g. "Graded", "Submitted") in green/amber

6. **Colors:**
   - Header: `#C0392B` (deep red) for normal, `#922B21` (darker) for overdue
   - Subject chip: `#27AE60` background with white text
   - Due pill: cream `#FEF3C7` with `#92400E` text
   - Body: `#FFFBF5` off-white
   - Footer button: `#F5CBA7` background with `#784212` text

---

### Files to Modify

| File | What Changes |
|---|---|
| `src/components/portals/student/StudentAssignmentsTab.tsx` | Rewrite `AssignmentCard` component with new visual design matching the reference image |

No new dependencies needed — all styling uses Tailwind and existing imports (`framer-motion`, `date-fns`, `lucide-react`, `StudentPortalIcon`).
