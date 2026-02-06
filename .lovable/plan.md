
# Auto AI Indexing on Book Upload

## Overview

This implementation will:
1. **Optimize the OCR edge function** to focus only on topics, chapters, and lessons (skip full OCR text extraction)
2. **Auto-trigger AI indexing** immediately after a book upload completes (status becomes 'ready')
3. **Start indexing all existing books** that have `index_status: 'pending'`

---

## Architecture

```text
Book Upload Complete (status: 'ready')
         |
         v
+------------------+
| BookUploadModal  |  After successful upload
| uploadSingleBook |  triggers startIndexing()
+------------------+
         |
         v
+------------------+     +----------------------+
| ocr-index-book   |---->| AI Gateway (Gemini)  |
| Edge Function    |     | Vision Analysis      |
+------------------+     +----------------------+
         |
         v
+------------------+
| book_page_index  |
| - topics[]       |
| - keywords[]     |  (No full OCR text)
| - chapter_title  |
| - summary        |
+------------------+
```

---

## Changes Required

### 1. Edge Function: Optimize for Topics/Chapters Only

**File**: `supabase/functions/ocr-index-book/index.ts`

Update the AI prompt to focus ONLY on:
- Topics and lessons (main focus)
- Chapter titles
- Section headers
- Key concepts/keywords
- Brief summary

Skip full OCR text extraction to save tokens and processing time.

**Updated Prompt**:
```text
Analyze this textbook/book page and extract ONLY:
1. Topics/Lessons visible (e.g., "Lesson 1: Photosynthesis", "Chapter 5: Fractions")
2. Chapter/Section title if visible
3. Key concepts and keywords (5-10 terms)
4. Brief 1-sentence summary of the lesson/topic

Do NOT extract full text. Focus on educational structure.
```

**Updated max_tokens**: Reduce from 4000 to 1500 (lighter extraction)

### 2. BookUploadModal: Auto-Trigger Indexing After Upload

**File**: `src/components/library/BookUploadModal.tsx`

After a book successfully uploads and status becomes 'ready':
1. Import `useBookIndexing` hook
2. Call `startIndexing(bookId)` immediately after upload completes

```typescript
// In uploadSingleBook function, after book status is 'ready':
await startIndexing(bookId);
toast.success(`Book uploaded! AI indexing started for ${book.title}`);
```

### 3. LibraryPage: Auto-Index Pending Books on Load

**File**: `src/components/library/LibraryPage.tsx`

Update the existing `useEffect` to actually trigger indexing for books with `index_status: 'pending'`:

```typescript
useEffect(() => {
  const indexPendingBooks = async () => {
    for (const book of books) {
      if (book.status === 'ready' && (!book.index_status || book.index_status === 'pending')) {
        // Start indexing with a small delay between each
        await startIndexing(book.id);
        await new Promise(r => setTimeout(r, 2000)); // 2s gap between books
      }
    }
  };
  
  if (books.length > 0 && !isIndexing) {
    indexPendingBooks();
  }
}, [books]); // Run once when books load
```

### 4. Show Indexing Toast/Status

Add visual feedback when auto-indexing starts:
- Toast notification: "AI is now scanning your books for topics and lessons..."
- Badge on book cards showing "Scanning..." status

---

## Technical Details

### Optimized AI Prompt (Edge Function)

```json
{
  "role": "user",
  "content": [
    {
      "type": "text", 
      "text": "Analyze this textbook page. Extract ONLY:\n1. Topic/Lesson name (e.g., 'Lesson 3: Plant Cells')\n2. Chapter title if visible\n3. Key concepts (5-10 keywords)\n4. 1-sentence summary\n\nReturn JSON: {\"topics\": [], \"chapter_title\": null, \"keywords\": [], \"summary\": \"\"}"
    },
    { "type": "image_url", "image_url": { "url": imageUrl } }
  ]
}
```

### Auto-Index Trigger Points

| Trigger | Location | Action |
|---------|----------|--------|
| After upload | BookUploadModal.tsx | `startIndexing(bookId)` called after status: 'ready' |
| On library load | LibraryPage.tsx | Index all books with `index_status: 'pending'` |
| Manual trigger | BookCard menu | Existing "Index for AI Search" option |

### Rate Limiting Protection

- 800ms delay between pages (existing)
- 2000ms delay between books when batch processing
- Retry with 5s delay on 429 errors (existing)

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ocr-index-book/index.ts` | Optimize prompt for topics/chapters only, reduce max_tokens |
| `src/components/library/BookUploadModal.tsx` | Add `useBookIndexing` hook, call `startIndexing` after upload |
| `src/components/library/LibraryPage.tsx` | Activate auto-indexing useEffect for pending books |

---

## User Experience

1. **User uploads a book** → Upload completes → "AI indexing started for [Book Title]" toast appears
2. **Library page loads** → System detects 5 pending books → Starts indexing sequentially with progress indicators
3. **BookCard badges** → Show "Indexing 23%" during processing, "AI Indexed" when complete
4. **AI Search** → Works immediately for indexed content (topics, lessons, chapters)

---

## Immediate Action

Once implemented, the system will immediately start indexing the 5 existing books:
1. Realistic MATH Scaling Greater Heights (0 pages - processing)
2. Achieve Creative Experiences and Skills in MAPEH (359 pages)
3. Computers for Digital Learners (299 pages)  
4. Grammar Essentials (165 pages)
5. EVERYDAY LIFE IN WORLD LITERATURE (267 pages)

Total: ~1,090 pages to index across 4 ready books.
