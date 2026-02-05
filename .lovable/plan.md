
# AI-Powered Book Cover Title Detection Plan

## Overview
Add AI functionality to automatically:
1. **Extract the book title** from the cover page using OCR/vision
2. **Display the first page as cover thumbnail** (already implemented - just needs preview in modal)

The system will render the first PDF page, send it to Lovable AI (Gemini) for title extraction, and auto-fill the title field.

---

## Implementation Approach

### Flow Diagram

```text
User selects PDF file
       |
       v
+----------------------+
| Render first page    |  Using existing pdfjs-dist
| to canvas (client)   |
+----------------------+
       |
       v
+----------------------+
| Display thumbnail    |  Show cover preview in modal
| preview in modal     |
+----------------------+
       |
       v
+----------------------+
| Convert to base64    |  For AI analysis
| and call AI endpoint |
+----------------------+
       |
       v
+----------------------+
| analyze-book-cover   |  New edge function
| edge function        |
+----------------------+
       |
       v
+----------------------+
| Extract title via    |  Using google/gemini-2.5-flash
| Lovable AI Gateway   |
+----------------------+
       |
       v
+----------------------+
| Auto-fill title      |  Update title input field
| in upload modal      |
+----------------------+
```

---

## New Files to Create

### 1. `supabase/functions/analyze-book-cover/index.ts`
Edge function to analyze book cover and extract title:
- Receives base64 image of the first page
- Uses Lovable AI Gateway with `google/gemini-2.5-flash` (vision-capable)
- Returns extracted title, detected subject (optional), and grade level hints
- Handles rate limits (429) and payment errors (402)

---

## Files to Modify

### 1. `src/hooks/usePdfToImages.ts`
Add a helper function to render just the first page for preview:
- `renderFirstPagePreview(pdfFile: File): Promise<{ blob: Blob, dataUrl: string }>`
- Returns both blob (for AI analysis) and dataUrl (for thumbnail preview)

### 2. `src/components/library/BookUploadModal.tsx`
Enhance with AI title detection:
- Add state for cover preview (`coverPreview: string | null`)
- Add state for AI analysis (`isAnalyzing: boolean`)
- When PDF is selected:
  1. Render first page as thumbnail preview
  2. Show preview in the upload area
  3. Call `analyze-book-cover` edge function
  4. Auto-fill title field with AI-detected title
- Add "Analyzing cover..." loading indicator
- Add visual feedback when AI successfully detects title

### 3. `supabase/config.toml`
Add the new edge function configuration

---

## Technical Details

| Aspect | Implementation |
|--------|---------------|
| AI Model | `google/gemini-2.5-flash` (vision-capable, fast) |
| API Key | `LOVABLE_API_KEY` (already configured) |
| Image Format | PNG base64 from canvas render |
| Scale Factor | 1.5x for AI analysis (balance quality/size) |
| Fallback | If AI fails, keep filename-based title |

---

## Edge Function: `analyze-book-cover`

**Request:**
```json
{
  "imageBase64": "data:image/png;base64,...",
  "filename": "Math_Grade5.pdf"
}
```

**Response:**
```json
{
  "success": true,
  "title": "Mathematics Grade 5",
  "subject": "Mathematics",
  "gradeLevel": 5,
  "confidence": 0.92
}
```

**AI Prompt:**
```
Analyze this book cover image and extract:
1. The exact book title (as written on the cover)
2. The subject (Mathematics, Science, English, Filipino, etc.)
3. The grade level if visible (1-12)

Respond in JSON format only.
```

---

## UI Changes in BookUploadModal

```text
+----------------------------------+
|  Upload New Book                 |
+----------------------------------+
|  [Cover Preview]                 |  <- NEW: Shows first page
|  +-------------------+           |
|  | [Book Cover       |           |
|  |  Thumbnail]       |           |
|  +-------------------+           |
|  🔄 Analyzing cover...           |  <- NEW: AI analysis status
|                                  |
|  Title * [Auto-filled Title___]  |  <- Auto-filled by AI
|  Grade Level * [Detected___]     |  <- Optional: Pre-select
|  Subject [Detected_________]     |  <- Optional: Pre-select
|  ...                             |
+----------------------------------+
```

---

## Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/analyze-book-cover/index.ts` |
| Modify | `src/hooks/usePdfToImages.ts` |
| Modify | `src/components/library/BookUploadModal.tsx` |
| Modify | `supabase/config.toml` |

---

## Error Handling

- **AI Rate Limit (429)**: Show toast "Please wait, analyzing..." and retry after delay
- **AI Credits Exhausted (402)**: Show toast, fall back to filename-based title
- **Network Error**: Show toast, keep filename as fallback
- **No Title Detected**: Keep the filename-based title (current behavior)
