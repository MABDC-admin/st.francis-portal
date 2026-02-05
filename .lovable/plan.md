

# PDF Upload, Summarization & PDF Export for Notebook LLM

## Overview

This feature adds two key capabilities to the Notebook LLM page:
1. **PDF Upload & Processing**: Users can upload a PDF file, which gets text-extracted and sent to the AI along with their prompt
2. **PDF Download**: After the AI generates output, users can download the result as a formatted PDF document

## User Flow

```text
+------------------------------------------------------------+
| Cell - LLM Prompt                             [Run] [Del]  |
| +--------------------------------------------------------+ |
| | Prompt: "Summarize this document"                      | |
| +--------------------------------------------------------+ |
| | [Upload PDF] or drag & drop                            | |
| | [document.pdf - 15 pages] [Remove]                     | |
| +--------------------------------------------------------+ |
| Output:                                     [Download PDF] | 
| +--------------------------------------------------------+ |
| | ## Document Summary                                    | |
| | This document covers...                                | |
| +--------------------------------------------------------+ |
+------------------------------------------------------------+
```

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/notebook/PdfUploadZone.tsx` | Drag-and-drop PDF upload with extraction |
| `src/utils/extractPdfText.ts` | PDF text extraction utility using pdfjs-dist |
| `src/utils/notebookPdfExport.ts` | Generate downloadable PDF from AI output |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/notebook/NotebookCell.tsx` | Add PDF upload zone and download button |
| `src/components/notebook/NotebookEditor.tsx` | Pass PDF text when running cells |
| `src/components/notebook/CellOutput.tsx` | Add download PDF button to output |
| `src/hooks/useNotebooks.ts` | Add PDF-related fields to interfaces |
| `supabase/functions/notebook-chat/index.ts` | Handle PDF text context in prompts |

## Database Migration

Add columns to `notebook_cells` table for storing PDF metadata:

```sql
ALTER TABLE notebook_cells 
ADD COLUMN pdf_filename text,
ADD COLUMN pdf_page_count integer,
ADD COLUMN pdf_extracted_text text;
```

## Component Details

### PdfUploadZone.tsx

A dedicated component for handling PDF uploads:
- Drag-and-drop zone with visual feedback
- File input for browsing
- Progress indicator during text extraction
- Display filename and page count when loaded
- "Remove" button to clear uploaded PDF
- Uses existing `pdfjs-dist` library (already installed)

### extractPdfText.ts

Utility function to extract text from PDF files:
- Load PDF using pdfjs-dist
- Extract text from each page (up to 50 pages)
- Concatenate with page markers (e.g., "--- Page 1 ---")
- Truncate to ~100,000 characters for context limits
- Return extracted text and page count

### notebookPdfExport.ts

Utility to generate a formatted PDF from AI output:
- Uses existing jsPDF library (already installed)
- Parse markdown content and convert to PDF format
- Include notebook title as header
- Format headings, paragraphs, lists, and code blocks
- Add timestamp and page numbers
- Trigger download with appropriate filename

### NotebookCell.tsx Updates

Add PDF upload zone and download functionality:
- Add `PdfUploadZone` component below the prompt textarea
- Track PDF state: filename, page count, extracted text
- Pass PDF data to parent component when running
- Show "Download PDF" button in output header when output exists
- Disable download during streaming

### CellOutput.tsx Updates

Add download button prop and rendering:
- Accept optional `onDownload` callback prop
- Show download button in output header area
- Button disabled while streaming

### NotebookEditor.tsx Updates

Handle PDF in the run flow:
- Receive PDF text from cell component
- Include PDF text in the request body to edge function
- Save PDF metadata after successful extraction

### Edge Function Update

Modify `notebook-chat/index.ts` to handle PDF context:
- Accept optional `pdfText` parameter in request body
- When PDF text is provided, construct context-aware prompt:
  ```
  System: "You are analyzing a document provided by the user."
  
  User: "[DOCUMENT START]
  {extracted PDF text}
  [DOCUMENT END]
  
  User's request: {original prompt}"
  ```
- Use appropriate model for longer context if needed

## Implementation Steps

### Phase 1: Database & Backend
1. Run migration to add PDF columns to `notebook_cells`
2. Update edge function to accept and process PDF text

### Phase 2: PDF Text Extraction
1. Create `extractPdfText.ts` utility
2. Create `PdfUploadZone.tsx` component

### Phase 3: PDF Download
1. Create `notebookPdfExport.ts` utility
2. Update `CellOutput.tsx` with download button

### Phase 4: Integration
1. Update `NotebookCell.tsx` to include upload zone and download
2. Update `NotebookEditor.tsx` to handle PDF in run flow
3. Update `useNotebooks.ts` types for PDF fields
4. Test end-to-end flow

## PDF Text Extraction Flow

```text
1. User drops/selects PDF file in upload zone
2. Show loading spinner with "Extracting text..."
3. Use pdfjs-dist to load the PDF document
4. Extract text from each page (limit to 50 pages)
5. Concatenate with page separators
6. Truncate if exceeds 100,000 characters
7. Store in component state (pdf_extracted_text)
8. Display filename and page count
9. User clicks "Run" to process
10. Send prompt + PDF text to edge function
11. Stream response back to output
12. Show "Download PDF" button when complete
```

## PDF Export Format

The exported PDF will include:
- **Header**: Notebook title, generation date
- **Content**: Formatted markdown output
  - Headings with appropriate font sizes
  - Paragraphs with proper spacing
  - Bullet points and numbered lists
  - Code blocks in monospace font
  - Tables with borders
- **Footer**: Page numbers

## Technical Notes

- **Dependencies**: Uses existing `jspdf` and `pdfjs-dist` libraries (no new installs needed)
- **File size limit**: 20MB maximum for uploaded PDFs
- **Text limit**: 100,000 characters max to stay within LLM context limits
- **Page limit**: Extract from first 50 pages only
- **Error handling**: Show clear error messages for unsupported/corrupted PDFs

