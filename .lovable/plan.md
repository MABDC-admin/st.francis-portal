

# Add YouTube Video References and Enhanced PDF Graphics

## What This Does
1. **YouTube Videos in AI Responses**: SchoolAI will automatically include relevant YouTube video links when answering academic queries. These links appear as styled, clickable video cards in the chat.
2. **Enhanced PDF Export**: The "Save as PDF" feature will include section icons (colored markers), styled headers, decorative separators, and visual indicators matching the chat formatting.

---

## Part 1: YouTube Video References

### System Prompt Update
**File: `src/components/aichat/constants.ts`**

Add a new section to `SCHOOL_SYSTEM_PROMPT` instructing the AI to include YouTube video references:
- After answering a query, include a `🎥 **Video References**` section
- Include 1-3 relevant YouTube search/video links in markdown format
- Use YouTube search URLs (`https://www.youtube.com/results?search_query=...`) when specific video IDs aren't known -- this ensures links always work
- Format: `[🎥 Video Title](https://youtube.com/results?search_query=topic+keywords)`

### Chat Bubble YouTube Styling
**File: `src/components/aichat/ChatMessageBubble.tsx`**

Update the custom `a` component in ReactMarkdown to detect YouTube links and render them with distinct styling:
- Detect `youtube.com` or `youtu.be` in `href`
- Render with a red/YouTube-branded pill style with a play icon
- Keep `target="_blank"` and `rel="noopener noreferrer"`

---

## Part 2: Enhanced PDF Export with Graphics and Icons

**File: `src/utils/aiChatPdfExport.ts`**

Enhance the PDF generator with visual elements:

1. **Section Icon Indicators**: Draw small colored circles before section headers to represent each icon type:
   - Blue circle for `📘 Topic`
   - Purple circle for `🧠 Explanation`
   - Green circle for `✅ Answer`
   - Orange circle for `📝 Steps`
   - Yellow circle for `💡 Tip`
   - Red circle for `⚠️ Warning`
   - Gray circle for `🔧 Technical`
   - Teal circle for `📊 Analysis`
   - Red circle for `🎥 Video References`

2. **Colored Section Headers**: Section header text rendered in matching colors (not just black)

3. **Decorative Separators**: Thin colored lines between major sections instead of plain gray

4. **Header Banner**: A styled header area with SchoolAI branding, a colored accent bar, and the date

5. **YouTube Link Rendering**: Detect YouTube URLs in the content and render them as styled text with a "VIDEO" label prefix and the URL printed below for reference

6. **Footer Enhancement**: Add SchoolAI logo text and a colored accent line in the footer

---

## Technical Details

### Files to Modify

| File | Change |
|------|--------|
| `src/components/aichat/constants.ts` | Add YouTube video reference instructions to system prompt |
| `src/components/aichat/ChatMessageBubble.tsx` | Add YouTube link detection and styled rendering |
| `src/utils/aiChatPdfExport.ts` | Add colored icon circles, styled headers, YouTube URL rendering, decorative separators |

### No New Dependencies
- Uses existing jsPDF drawing primitives (circles, colored text, lines)
- Uses existing ReactMarkdown custom components
- YouTube links are standard URLs -- no embed API needed

### YouTube Link Detection Logic
```text
href includes "youtube.com" OR "youtu.be"
  -> Render with red accent, play icon, "Watch on YouTube" label
```

### PDF Icon Rendering Logic
```text
Line starts with emoji pattern (📘, 🧠, ✅, etc.)
  -> Draw colored circle (3mm diameter) at left margin
  -> Render header text in matching color, offset right
  -> Add thin colored underline
```
