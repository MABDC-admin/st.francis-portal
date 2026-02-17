

## Replace URL Inputs with File Upload for Banner Media

Currently the Banner Management form uses text inputs for "Media URL" and "Thumbnail URL". This plan replaces both with drag-and-drop / click-to-upload file pickers that upload to the existing `school-gallery` storage bucket.

### Changes

**File: `src/components/management/BannerManagement.tsx`**

1. Add upload state tracking (`uploading`, `uploadingThumbnail`)
2. Create a reusable upload handler that:
   - Validates file size (max 20MB for videos, 5MB for images)
   - Uploads to the `school-gallery` bucket under a path like `banners/{uuid}/{filename}`
   - Gets the public URL and sets it in form state
3. Replace the "Media URL" text input (lines 303-311) with a file upload area:
   - Accept `image/*` when type is "image", `video/*` when type is "video"
   - Show a preview (image thumbnail or video icon) when a file is uploaded
   - Show a remove button to clear the uploaded file
   - If editing an existing banner, show the current media as a preview
4. Replace the "Thumbnail URL" text input (lines 314-322) with a similar file upload area:
   - Only shown when type is "video"
   - Accepts `image/*` only
5. Update form validation in `handleSubmit` to check for `formData.url` presence

### Technical Details

- **Storage bucket**: `school-gallery` (already exists, public)
- **Upload path**: `banners/{randomUUID}/{filename}`
- **Public URL retrieval**: `supabase.storage.from('school-gallery').getPublicUrl(path)`
- **File size limits**: 5MB for images, 20MB for videos
- **Accepted formats**: `image/png, image/jpeg, image/webp, image/gif` for images; `video/mp4, video/webm` for videos
- **No database changes needed** -- the `url` and `thumbnail_url` columns already store URLs

### UI Behavior

- Upload area shows a dashed border with an upload icon and "Click to upload" text
- During upload: shows a spinner with "Uploading..." text
- After upload: shows a preview with a remove/clear button
- When editing an existing banner, the current media displays as a preview with option to replace
