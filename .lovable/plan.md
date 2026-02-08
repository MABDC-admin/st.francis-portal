

# Enhanced PDF Export for AI Chat Responses

## Overview

Upgrade the existing `exportResponseToPdf` function in `src/utils/aiChatPdfExport.ts` with clickable hyperlinks, embedded AI-generated images, auto-generated table of contents, and improved visual quality. The current implementation strips links and ignores images -- the new version preserves both.

## What Changes

### 1. Clickable Hyperlinks with URL Validation

Currently all markdown links are stripped to plain text. The new version will:

- Parse `[text](url)` patterns and render them as **clickable PDF links** using jsPDF's `doc.textWithLink()` API
- Validate URLs before embedding (must start with `http://` or `https://`)
- Style links in blue with underline so they're visually identifiable
- YouTube links get a red "VIDEO" badge (already exists) but now also become clickable
- Invalid/malformed URLs render as plain text with a small "[invalid link]" note

### 2. Embedded Images (AI-Generated)

The `Message` type already carries an `images` array. The export function will:

- Accept an optional `images` parameter (the message's `ChatImage[]`)
- For each base64 data URL image, embed it into the PDF using `doc.addImage()`
- Scale images to fit within the usable width (max 150mm wide) while preserving aspect ratio
- Use PNG format for best quality within jsPDF
- Skip external URLs that can't be embedded client-side (add a placeholder note instead)

### 3. Auto-Generated Table of Contents

For longer responses, a TOC page is inserted after the header:

- During the first pass, collect all headings (`#`, `##`, `###`) with their text and page numbers
- If there are 3+ headings, generate a TOC on page 2 with clickable internal links using `doc.link()` pointing to each heading's Y position
- Each TOC entry shows: heading text (indented by level) and page number (right-aligned, dotted leader)
- TOC entries are styled with the section color if an emoji section header

### 4. Improved Visual Quality

- Increase default font rendering quality (jsPDF uses 72 DPI by default; we set `doc.setProperties({ creator: 'SchoolAI' })` and use mm units which already produce clean vector text)
- All text, lines, and shapes in jsPDF are already vector -- no rasterization needed
- Images embedded at their original resolution (base64 images from AI are typically 1024x1024)
- Bold text segments within paragraphs rendered inline (currently bold markers are stripped)

### 5. Suggestion Block Exclusion

The `💡 **Suggestion:**` block appended by the AI is **stripped before export** so it doesn't appear in the downloaded PDF (it's a UI-only element).

### 6. Error Handling

- Wrap the entire export in try/catch with a toast notification on failure
- Image embedding failures are caught individually (skip broken images, continue export)
- File size check after generation -- warn if over 10MB via toast

## Files to Modify

| File | Change |
|------|--------|
| `src/utils/aiChatPdfExport.ts` | Complete rewrite of export function with links, images, TOC, inline bold |
| `src/components/aichat/ChatMessageBubble.tsx` | Pass `message.images` to the export function |

## Technical Details

### Link Rendering

jsPDF supports clickable links via `doc.textWithLink(text, x, y, { url })`. For inline links within paragraphs:

```text
1. Parse line for [text](url) patterns
2. Validate URL (must match /^https?:\/\//)
3. Split line into segments: plain text + link text
4. Render plain segments with doc.text()
5. Render link segments with doc.textWithLink() in blue + underline
6. Track X position across segments for inline flow
```

### Image Embedding

```text
1. Check if image URL starts with "data:image/"
2. Extract format (png/jpeg/webp) from data URL
3. Create temporary Image() to get natural dimensions
4. Calculate scaled dimensions to fit within usableWidth
5. Call doc.addImage(dataUrl, format, x, y, width, height)
6. Advance Y cursor by image height + margin
```

### Table of Contents (Two-Pass Rendering)

```text
Pass 1: Parse all lines, collect headings with estimated page numbers
Pass 2: If 3+ headings exist:
  - Insert new page after header as TOC
  - Render "Table of Contents" title
  - For each heading: render text + page number with doc.link() internal destination
  - Adjust all subsequent page numbers by +1
Pass 3: Render content as before (with page offset)
```

### Inline Bold Rendering

Instead of stripping `**bold**` markers, the renderer will:

```text
1. Split text by **...** patterns
2. Alternate between normal and bold font
3. Measure each segment width with doc.getTextWidth()
4. Render segments sequentially, advancing X position
```

### URL Validation

```text
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
```

### Export Function Signature Change

```text
// Before
exportResponseToPdf(content: string, documentName?: string)

// After
exportResponseToPdf(content: string, documentName?: string, images?: ChatImage[])
```

### No New Dependencies

Uses `jsPDF` (already installed) and `jspdf-autotable` (already installed, used for TOC table if needed). All other logic is vanilla TypeScript.

