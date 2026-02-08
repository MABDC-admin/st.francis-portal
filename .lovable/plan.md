

# Guided Action Flow: Click "+" First, Then Type

## What Changes
The text input starts **disabled/dimmed** with a placeholder like "Tap + to get started..." guiding the teacher to click the "+" button first. After choosing an action from the menu, the input activates with the prefilled text and a visible label showing what mode they're in (e.g., "Search YouTube Videos"). A small "x" on the label lets them cancel and return to the guided state.

## Visual Flow

```text
INITIAL STATE (input disabled):
+--------------------------------------------------+
|  [+]  [ Tap + to get started... (dimmed) ] [Send] |
+--------------------------------------------------+

AFTER clicking "+" and choosing "Search YouTube Videos":
+--------------------------------------------------+
|  [+]  [🎥 YouTube Search ✕] [Search YouTube for |] [Send] |
+--------------------------------------------------+
         ^-- active mode badge        ^-- input now active, cursor here
```

## How It Works

### 1. New state: `activeMode` in `AIChatPage.tsx`
- Add `activeMode` state: `{ label: string, icon: string, prefix: string } | null`
- When no mode is selected and input is empty, the textarea is **read-only** with a guiding placeholder
- When the user picks an action from the menu, set `activeMode` and prefill the input
- Clicking "x" on the mode badge clears `activeMode` and resets the input
- After sending a message, `activeMode` is cleared
- If the user starts typing directly (without clicking +), the input still works -- this is just a UX guide, not a hard lock

### 2. Update `ChatActionMenu.tsx`
- Change `onPrefill` callback to also pass mode metadata: `onSelect: (text: string, mode: { label: string, icon: string }) => void`
- Each action item includes its label and emoji for the badge

### 3. Update input area in `AIChatPage.tsx`
- Show a colored badge/chip before the textarea when `activeMode` is set (e.g., "🎥 YouTube Search [x]")
- Textarea placeholder changes based on mode (e.g., "Type a topic to search on YouTube...")
- The textarea is subtly dimmed (not fully disabled) when no mode is active, with the placeholder guiding to click "+"

## Files to Modify

| File | Change |
|------|--------|
| `src/components/aichat/ChatActionMenu.tsx` | Pass mode metadata (label + icon) alongside prefill text |
| `src/components/aichat/AIChatPage.tsx` | Add `activeMode` state, mode badge chip, guided placeholder on textarea |

## Key Details
- Input is **not hard-disabled** -- teachers can still type freely without choosing a mode (power users)
- The guided placeholder is just a soft UX nudge for less tech-savvy teachers
- The mode badge disappears after sending a message
- File upload action still works the same (no mode badge needed)
