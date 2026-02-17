

## Fix Storage RLS and Document/Photo Viewing for Teacher Applications

### Problem

The `teacher-applications` storage bucket is **private**, but the admin detail view (`ApplicantDetailDialog`) tries to render document links and the profile photo using raw storage paths (e.g., `abc-uuid/resume.pdf`) directly as URLs. These paths are not valid URLs -- they need signed URLs to be viewable.

Additionally, the storage RLS policies have gaps:
- Duplicate anonymous INSERT policies
- Missing UPDATE policy for authenticated users
- Missing DELETE policy cleanup (one exists but was created outside the numbered migration)

### Changes

#### 1. Database Migration -- Clean Up Storage RLS Policies

- Drop duplicate anonymous INSERT policy (`Allow anon uploads` -- redundant with `Allow anonymous upload to teacher-applications`)
- Add an UPDATE policy for authenticated users on the `teacher-applications` bucket
- Ensure DELETE policy exists for authenticated users (verify or recreate `Allow authenticated maintenance`)

#### 2. Update `ApplicantDetailDialog.tsx` -- Use Signed URLs for Documents and Photo

- Create a helper function that generates signed URLs using `supabase.storage.from('teacher-applications').createSignedUrl(path, 3600)` (1-hour expiry)
- On component mount, generate signed URLs for all document fields (`resume_url`, `transcript_url`, `diploma_url`, `valid_id_url`, `prc_license_url`, `certificates_url[]`) and `photo_url`
- Store the signed URLs in local state
- Update the `DocumentLink` component to use the resolved signed URLs
- Update the photo `<img>` tag to use the signed photo URL
- Show a loading state while URLs are being generated

#### 3. Update `PersonalInfoStep.tsx` -- Preview Using Signed URL

- When `formData.photo_url` is set (editing or after upload), generate a signed URL for preview if `previewUrl` is not already set from a fresh upload
- This ensures the photo displays correctly when revisiting the step

### Technical Details

**Signed URL pattern:**
```typescript
const { data } = await supabase.storage
  .from('teacher-applications')
  .createSignedUrl(storagePath, 3600); // 1 hour
// data.signedUrl is the viewable URL
```

**Storage policies after migration:**

| Policy | Operation | Role | Condition |
|--------|-----------|------|-----------|
| Allow anonymous upload | INSERT | anon | bucket = teacher-applications |
| Allow authenticated upload | INSERT | authenticated | bucket = teacher-applications |
| Admin registrar can read | SELECT | authenticated | bucket = teacher-applications |
| Allow authenticated update | UPDATE | authenticated | bucket = teacher-applications |
| Allow authenticated maintenance | DELETE | authenticated | bucket = teacher-applications |

**Files to modify:**
- New SQL migration (storage RLS cleanup)
- `src/components/teacher-application/ApplicantDetailDialog.tsx` (signed URLs for docs + photo)
- `src/components/teacher-application/steps/PersonalInfoStep.tsx` (signed URL for photo preview)

**No changes to the public upload flow** -- anon INSERT is already working for applicants submitting forms.
