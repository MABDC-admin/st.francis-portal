

# Double PDF-to-Image Resolution and Switch to WebP

## Analysis: WebP vs PNG vs JPEG

| Factor | JPEG (current) | PNG | WebP (recommended) |
|--------|----------------|-----|---------------------|
| File size (typical A4 page) | ~300-500KB | ~1-2MB | ~150-300KB |
| Quality | Lossy, good | Lossless, perfect | Lossy/lossless, excellent |
| Transparency | No | Yes | Yes |
| Text clarity | Artifacts at edges | Sharp | Sharp |
| Browser support | Universal | Universal | 97%+ (all modern browsers) |
| AI/OCR readability | Good | Best | Very good |

**Verdict: WebP is the best approach.** It produces files 25-35% smaller than JPEG at equivalent quality, with sharper text rendering (important for document OCR). Browser support is effectively universal for this project's target audience.

## What Changes

### 1. `src/utils/pdfToImages.ts` (Student Documents)
- Change render scale from `2` to `4` (doubling resolution)
- Switch output format from `image/jpeg` at 0.92 to `image/webp` at 0.90
- Update comments and function documentation
- Update the `PageImage` interface to reflect the new format

### 2. `src/hooks/usePdfToImages.ts` (Library Books)
- Change render scale from `2` to `4` for high-res images
- Change thumbnail scale from `0.5` to `1.0` (doubling)
- Switch output format from `image/png` to `image/webp` at 0.90
- Update `canvas.toDataURL` calls to use `image/webp`
- Update storage upload `contentType` from `image/png` to `image/webp`

### 3. `src/components/students/DocumentsManager.tsx`
- Update the page file creation to use `.webp` extension and `image/webp` type instead of `.jpg` / `image/jpeg`

## Notes
- Thumbnail generation in `createPdfThumbnail` will also benefit from WebP (smaller blobs for previews)
- Existing uploaded images (JPEG/PNG) in storage will continue to work -- browsers handle mixed formats fine
- The AI analysis pipeline (`analyze-document` function) already handles any image MIME type, so no backend changes needed
