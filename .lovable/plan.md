

# Docker App Deep Integrations

Integrating 6 self-hosted Docker apps (NocoDB, OnlyOffice, Excalidraw, Omada Cloud Controller, Tactical RMM, Documize) into the school management system via backend proxy functions and native UI components.

---

## Architecture Overview

Each Docker app follows the same secure pattern:

1. **Secrets**: Store each app's URL + API credentials as backend secrets (never exposed to browser)
2. **Backend proxy function**: A single edge function per app that proxies API calls, keeping credentials server-side
3. **Frontend component**: A native React dashboard that calls the proxy function and displays data within the existing UI

---

## Phase 1: NocoDB (Database/Spreadsheet Platform)

**Secrets needed**: `NOCODB_BASE_URL`, `NOCODB_API_TOKEN`

**Backend function**: `supabase/functions/nocodb-proxy/index.ts`
- Proxies GET/POST/PUT/DELETE requests to NocoDB REST API v2
- Endpoints: list bases, list tables, list/create/update/delete records

**Frontend**: `src/components/nocodb/NocoDBDashboard.tsx`
- Shows list of NocoDB bases and tables
- Table viewer with inline editing (similar to spreadsheet)
- Create/edit/delete records from within the school dashboard
- Search and filter records

---

## Phase 2: OnlyOffice (Document Editing)

**Secrets needed**: `ONLYOFFICE_URL`, `ONLYOFFICE_JWT_SECRET`

**Backend function**: `supabase/functions/onlyoffice-proxy/index.ts`
- Generates signed JWT tokens for the Document Server
- Handles document callback URLs for save events

**Frontend**: `src/components/onlyoffice/OnlyOfficeDashboard.tsx`
- Document list from database storage
- Opens documents in an embedded OnlyOffice editor (iframe with signed config)
- Create new documents (Word, Excel, PowerPoint)
- Collaborative editing support via OnlyOffice's built-in collab features

---

## Phase 3: Excalidraw (Whiteboard/Drawing)

**Secrets needed**: `EXCALIDRAW_URL`

**Backend function**: `supabase/functions/excalidraw-proxy/index.ts`
- Proxies requests to self-hosted Excalidraw server
- Manages saved drawings in a `excalidraw_drawings` database table

**Database table**: `excalidraw_drawings`
| Column | Type | Description |
|---|---|---|
| id | uuid PK | Auto-generated |
| school_id | uuid | School reference |
| title | text | Drawing name |
| scene_data | jsonb | Excalidraw scene JSON |
| created_by | uuid | Creator |
| is_shared | boolean | Whether shared with others |
| created_at / updated_at | timestamptz | Timestamps |

**Frontend**: `src/components/excalidraw/ExcalidrawDashboard.tsx`
- Gallery of saved drawings
- Embedded Excalidraw editor (iframe to self-hosted instance)
- Save/load drawings to/from database
- Share drawings with other staff

---

## Phase 4: Omada Cloud Controller (Network Management)

**Secrets needed**: `OMADA_URL`, `OMADA_CLIENT_ID`, `OMADA_CLIENT_SECRET`

**Backend function**: `supabase/functions/omada-proxy/index.ts`
- Authenticates with Omada controller API (OAuth2 client credentials)
- Proxies read-only dashboard data: connected clients, AP status, network stats

**Frontend**: `src/components/omada/OmadaDashboard.tsx`
- Network overview: total APs, connected clients, bandwidth usage
- AP status list (online/offline, client count per AP)
- Connected devices list with search
- Network health indicators (charts using recharts)

---

## Phase 5: Tactical RMM (Remote Monitoring)

**Secrets needed**: `TACTICALRMM_URL`, `TACTICALRMM_API_KEY`

**Backend function**: `supabase/functions/tacticalrmm-proxy/index.ts`
- Proxies requests to Tactical RMM API
- Endpoints: list agents, agent details, alerts, patch status

**Frontend**: `src/components/tacticalrmm/TacticalRMMDashboard.tsx`
- Device inventory: all monitored school computers with status
- Alert summary: critical/warning/info alerts
- Patch compliance overview
- Quick actions: trigger check-in, view agent details
- Stats cards for total devices, online/offline, pending patches

---

## Phase 6: Documize (Knowledge Base/Wiki)

**Secrets needed**: `DOCUMIZE_URL`, `DOCUMIZE_API_KEY` (or `DOCUMIZE_USERNAME` + `DOCUMIZE_PASSWORD`)

**Backend function**: `supabase/functions/documize-proxy/index.ts`
- Authenticates with Documize API
- Proxies: list spaces, list documents, get document content, search

**Frontend**: `src/components/documize/DocumizeDashboard.tsx`
- Space/folder browser
- Document list with search
- Document viewer (renders content inline or opens in new tab)
- Quick-link to create new documents on the Documize server

---

## Navigation Changes

**`src/components/layout/DashboardLayout.tsx`**

Add a new **"Integrations"** collapsible group in the sidebar for Admin role:
- NocoDB (Database)
- OnlyOffice (Documents)
- Excalidraw (Whiteboard)
- Omada (Network)
- Tactical RMM (Devices)
- Documize (Wiki)

Add icon mappings for all 6 new tab IDs in both `icon3DMap` and `iconAppleMap`.

**`src/pages/Index.tsx`**

Add 6 new tab render blocks:
- `nocodb` tab renders `NocoDBDashboard`
- `onlyoffice` tab renders `OnlyOfficeDashboard`
- `excalidraw` tab renders `ExcalidrawDashboard`
- `omada` tab renders `OmadaDashboard`
- `tacticalrmm` tab renders `TacticalRMMDashboard`
- `documize` tab renders `DocumizeDashboard`

All restricted to Admin role (with Registrar access optional).

---

## Credential Setup Flow

When you're ready to provide credentials, I'll request them one service at a time using secure secret storage. Each integration can be built and tested independently -- you don't need all credentials upfront. We can start with whichever app you want connected first.

---

## Files Summary

### New Edge Functions (6)
- `supabase/functions/nocodb-proxy/index.ts`
- `supabase/functions/onlyoffice-proxy/index.ts`
- `supabase/functions/excalidraw-proxy/index.ts`
- `supabase/functions/omada-proxy/index.ts`
- `supabase/functions/tacticalrmm-proxy/index.ts`
- `supabase/functions/documize-proxy/index.ts`

### New Frontend Components (6 directories)
- `src/components/nocodb/NocoDBDashboard.tsx`
- `src/components/onlyoffice/OnlyOfficeDashboard.tsx`
- `src/components/excalidraw/ExcalidrawDashboard.tsx`
- `src/components/omada/OmadaDashboard.tsx`
- `src/components/tacticalrmm/TacticalRMMDashboard.tsx`
- `src/components/documize/DocumizeDashboard.tsx`

### New Database Table (1)
- `excalidraw_drawings` -- for saving whiteboard drawings

### Modified Files (2)
- `src/components/layout/DashboardLayout.tsx` -- new "Integrations" nav group + icon maps
- `src/pages/Index.tsx` -- 6 new tab render blocks

