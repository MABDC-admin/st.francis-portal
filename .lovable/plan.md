

# Enhance School Showcase: Gallery Upload, Map Fix, and Visit Confirmation

## Overview

This plan addresses five key issues: removing the "Back to School Info" button, fixing the map embed, fixing the gallery slider, adding photo upload for admins, and ensuring responsiveness.

## Changes

### 1. Remove "Back to School Info" Button

In `VisitScheduler.tsx`, the confirmation screen (line 100-102) shows a "Back to School Info" button after booking. This will be removed and replaced with a simple "Close" or "Done" action that closes the dialog.

### 2. Fix Map Integration

The current map uses an `iframe` with `map_embed_url`, which requires admins to paste a full Google Maps embed URL -- error-prone and often broken. The fix:

- Use the existing `latitude` and `longitude` columns in `school_info` to construct a reliable Google Maps embed URL automatically
- Fall back to `map_embed_url` if lat/lng are not set
- Add latitude/longitude input fields to the `SchoolInfoManager` admin form
- The embed URL will be constructed as: `https://www.google.com/maps/embed/v1/place?key=...&q={lat},{lng}` or use the simpler no-API-key approach: `https://maps.google.com/maps?q={lat},{lng}&output=embed`

### 3. Fix Gallery Image Slider

The current `AnimatePresence` + `motion.img` approach can cause flickering when images fail to load. Fixes:

- Add `onError` handler to images with a fallback placeholder
- Add image loading state with a skeleton/spinner
- Reset `photoIndex` to 0 when photos array changes
- Add touch/swipe support for mobile using simple touch event handlers

### 4. Photo Upload for Admin Gallery

**Database**: Create a new storage bucket `school-gallery` (public) with appropriate RLS policies.

**SchoolInfoManager changes**:
- Replace the "paste URL" input with a drag-and-drop upload zone using `react-dropzone` (already installed)
- Accept JPEG, PNG, WebP formats, max 5MB per file
- Show upload preview before confirming
- Upload to `school-gallery/{school_id}/{filename}` in storage
- Get the public URL and append it to the `facility_photos` JSONB array
- Show existing photos with delete capability

### 5. Responsive Design

All components already use Tailwind responsive classes. The gallery and map will use `aspect-video` containers that scale properly. The upload dropzone will be full-width on mobile.

---

## Technical Details

### Database Migration

```sql
-- Create storage bucket for school gallery photos
INSERT INTO storage.buckets (id, name, public) VALUES ('school-gallery', 'school-gallery', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload school gallery photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'school-gallery');

-- Allow public read access
CREATE POLICY "Public can view school gallery photos"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'school-gallery');

-- Allow authenticated users to delete
CREATE POLICY "Authenticated users can delete school gallery photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'school-gallery');
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/registration/VisitScheduler.tsx` | Remove "Back to School Info" button from confirmation view |
| `src/components/registration/SchoolShowcaseDialog.tsx` | Fix map to use lat/lng fallback, add image error handling and loading states, add swipe support to gallery |
| `src/components/registration/SchoolInfoManager.tsx` | Add lat/lng fields, replace URL input with drag-and-drop upload using `react-dropzone`, upload to storage bucket |
| Database migration | Create `school-gallery` bucket with RLS policies |

### Upload Flow (SchoolInfoManager)

```text
Admin drops image file
  --> Validate format (JPEG/PNG/WebP) and size (max 5MB)
  --> Show preview thumbnail
  --> Upload to storage: school-gallery/{schoolId}/{timestamp}_{filename}
  --> Get public URL from Supabase storage
  --> Append URL to facility_photos array in form state
  --> Save to school_info table on "Save" click
```

### Map Rendering Logic (SchoolShowcaseDialog)

```text
If latitude AND longitude exist:
  --> Render iframe with constructed Google Maps embed URL
Else if map_embed_url exists:
  --> Render iframe with the raw embed URL (current behavior)
Else:
  --> Show "Location not available" placeholder
```
