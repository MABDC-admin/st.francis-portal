

# Auto-Append Contextual Suggestions After Each AI Response

## What Changes

After every AI response, a visually distinct suggestion block appears (e.g., "💡 Suggestion: ..."). This is driven by the system prompt instructing the AI to always append it, and the frontend parses and renders it as a styled callout box. A toggle in the chat header lets the user turn this on/off (defaults to ON, persisted in localStorage).

## How It Works

### 1. System Prompt Update (`constants.ts`)

Add a new section to `SCHOOL_SYSTEM_PROMPT` instructing the AI to always end responses with a suggestion block:

```text
========================
12) CONTEXTUAL SUGGESTIONS
========================

After EVERY response, append a suggestion block on a new line using this exact format:

💡 **Suggestion:** [1-2 sentence actionable next step or recommendation based on the topic just discussed]

Rules:
- Must be contextually relevant to the main response
- Must not exceed 2 sentences
- Must be actionable (e.g., "Try solving...", "Next, explore...", "Create a quiz on...")
- Place it as the very last thing, after Video References
- Use exactly the prefix: 💡 **Suggestion:**
```

### 2. Visual Rendering in `ChatMessageBubble.tsx`

Parse the assistant message content to detect the suggestion block (line starting with "💡 **Suggestion:**"). Render it separately as a styled callout card:

- Amber/yellow background with a lightbulb icon
- Rounded border, slightly indented
- Visually separated from the main response by a thin divider
- Only rendered when the suggestion toggle is enabled

The parsing splits the content at the suggestion line, rendering the main content normally via ReactMarkdown and the suggestion in its own styled container.

### 3. Toggle in Chat Header (`AIChatPage.tsx`)

Add a small Switch toggle in the header bar labeled with a lightbulb icon. State is stored in `localStorage` key `ai-suggestions-enabled` (defaults to `true`). The toggle is passed down to `ChatMessageBubble` to control whether the suggestion callout renders.

## Visual Preview

```text
Assistant response bubble:
+------------------------------------------+
| [Main response content with markdown]    |
|                                          |
| 🎥 Video References                     |
| - [Video link]                           |
|                                          |
| ┌─────────────────────────────────────┐  |
| │ 💡 Suggestion: Try creating a 5-   │  |
| │ item quiz on this topic to test     │  |
| │ your understanding.                 │  |
| └─────────────────────────────────────┘  |
|                                          |
| [Download] Save as PDF                   |
+------------------------------------------+
```

Toggle in header:
```text
[SchoolAI icon] SchoolAI          [💡 on/off] [Clear]
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/aichat/constants.ts` | Add section 12 to system prompt with suggestion format instructions |
| `src/components/aichat/ChatMessageBubble.tsx` | Parse and render suggestion block as styled callout; accept `showSuggestions` prop |
| `src/components/aichat/AIChatPage.tsx` | Add localStorage-backed toggle state, render Switch in header, pass prop to message bubbles |

## Technical Details

### Content Parsing Logic (ChatMessageBubble)
```text
const suggestionRegex = /\n?💡 \*\*Suggestion:\*\*\s*.+$/s;
const match = content.match(suggestionRegex);
const mainContent = match ? content.slice(0, match.index) : content;
const suggestionText = match ? match[0].replace('💡 **Suggestion:**', '').trim() : null;
```

### Toggle State (AIChatPage)
```text
const [showSuggestions, setShowSuggestions] = useState(() => {
  const saved = localStorage.getItem('ai-suggestions-enabled');
  return saved !== null ? saved === 'true' : true; // default ON
});
// Persist on change
useEffect(() => {
  localStorage.setItem('ai-suggestions-enabled', String(showSuggestions));
}, [showSuggestions]);
```

### Suggestion Callout Styling
- Container: `bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2`
- Icon: Lightbulb emoji inline
- Text: `text-sm text-amber-800`
- Hidden when `showSuggestions` is false or when streaming

### No New Dependencies
All changes use existing React state, Tailwind classes, localStorage, and regex parsing.
