

# Replace OnlyOffice with Google Docs Embed

## Overview
Replace the OnlyOffice document editing integration with embedded Google Docs/Sheets/Slides. Instead of requiring a self-hosted OnlyOffice server, users will be able to create and manage Google Docs directly within the dashboard using iframes.

## What Changes

### 1. New Component: `GoogleDocsDashboard.tsx`
Replace `OnlyOfficeDashboard.tsx` with a new dashboard that:
- Displays a list of saved Google Doc links (stored in a new database table)
- Allows adding a Google Doc/Sheet/Slides URL to embed
- Opens documents in an embedded iframe using Google's public embed URLs (e.g., `https://docs.google.com/document/d/{id}/edit?embedded=true`)
- Supports creating new blank documents via direct Google Docs links
- Provides edit/delete for saved document entries

### 2. Database Table: `google_docs`
Create a new table to store document references:
- `id` (uuid, primary key)
- `title` (text, not null)
- `url` (text, not null) -- the Google Docs/Sheets/Slides URL
- `doc_type` (text) -- "document", "spreadsheet", or "presentation"
- `school_id` (uuid, FK to schools)
- `created_by` (uuid, references auth.users)
- `created_at` / `updated_at` timestamps
- RLS: Admin-only access (matching the existing OnlyOffice admin-only pattern)

### 3. Update References
- **`src/pages/Index.tsx`**: Replace `OnlyOfficeDashboard` import with `GoogleDocsDashboard`
- **`src/components/layout/DashboardLayout.tsx`**: Update label from "OnlyOffice" to "Google Docs" and keep the same sidebar slot (`onlyoffice` id can remain or be renamed)

### 4. Cleanup
- Delete `src/components/onlyoffice/OnlyOfficeDashboard.tsx`
- Delete `supabase/functions/onlyoffice-proxy/index.ts`
- Remove `onlyoffice-proxy` config from `supabase/config.toml` (auto-managed, so just note this)

## Technical Details

### Google Docs Embed Pattern
Google Docs can be embedded without any API key by converting a share URL:
```
Original:  https://docs.google.com/document/d/{DOC_ID}/edit
Embedded:  https://docs.google.com/document/d/{DOC_ID}/edit?embedded=true
```
The document must be shared (at minimum "anyone with the link can view/edit") for the embed to work. The dashboard will display instructions about sharing settings.

### Database Migration SQL
```sql
CREATE TABLE public.google_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  doc_type text NOT NULL DEFAULT 'document',
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.google_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage google docs"
ON public.google_docs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
```

### Component Structure
- **Document list view**: Cards showing saved documents with title, type badge, and open/delete actions
- **Add document dialog**: Form with title, URL input, and type selector (Doc/Sheet/Slides)
- **Embedded viewer**: When a document is selected, show it in a full-height iframe within the dashboard
- **No API key required**: Pure iframe embedding with publicly shared Google Docs

### Files to Create
- `src/components/googledocs/GoogleDocsDashboard.tsx`

### Files to Modify
- `src/pages/Index.tsx` -- swap import and usage
- `src/components/layout/DashboardLayout.tsx` -- update label

### Files to Delete
- `src/components/onlyoffice/OnlyOfficeDashboard.tsx`
- `supabase/functions/onlyoffice-proxy/index.ts`

