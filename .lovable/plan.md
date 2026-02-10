
# Helpdesk Enhancement Plan

## Issues Identified

1. **No "PC Name" column** -- The `helpdesk_tickets` table has no field for the originating PC/device name.
2. **No requester name displayed** -- Queries join to `auth.users` for email only. The `profiles` table has `full_name` but it's not being joined or shown.
3. **Admin visibility is correct at RLS level** -- Admins can already see all tickets via existing policies. No RLS changes needed.
4. **Missing `helpdesk-files` storage bucket** -- The attachment upload targets a bucket called `helpdesk-files` that doesn't exist in the configured buckets, so uploads will fail.
5. **Ticket creation doesn't invalidate the ticket list query** -- After creating a ticket, the list doesn't refresh.
6. **TicketDetail "Back" button** navigates to `"/"` with state, not to `/helpdesk`.

## Plan

### 1. Database Migration

Add a `pc_name` column to `helpdesk_tickets`:

```sql
ALTER TABLE public.helpdesk_tickets
  ADD COLUMN pc_name text DEFAULT NULL;
```

Create the missing `helpdesk-files` storage bucket:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('helpdesk-files', 'helpdesk-files', false)
ON CONFLICT (id) DO NOTHING;
```

Add storage RLS policies so authenticated users can upload/download:

```sql
CREATE POLICY "Authenticated users can upload helpdesk files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'helpdesk-files');

CREATE POLICY "Authenticated users can read helpdesk files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'helpdesk-files');
```

### 2. CreateTicketDialog -- Add PC Name Field

- Add a `pc_name` field to the form schema (optional text input).
- Include it in the insert payload.
- Label it "PC / Device Name" with a placeholder like "e.g. PC-LAB01".

### 3. TicketList -- Show Requester Name and PC Name

- Update the query in `HelpdeskIndex` to also join `profiles` via `created_by`:
  ```
  creator:created_by ( id, email ),
  creator_profile:created_by ( full_name )
  ```
  Or join profiles separately. Since `created_by` references `auth.users`, and we need `profiles.full_name`, we'll do a separate profiles lookup or adjust the select to join profiles by ID.
- Actually, the simplest approach: query `profiles` table joined by `created_by`:
  ```sql
  creator_profile:profiles!helpdesk_tickets_created_by_fkey ( full_name )
  ```
  But there's no FK from helpdesk_tickets.created_by to profiles. We'll use a manual approach -- fetch profiles separately or use a subquery. The cleanest solution: join profiles in the select using the `created_by` field:
  ```
  profiles!inner ( full_name )
  ```
  This won't work without a FK. Best approach: fetch all unique creator IDs from tickets, then batch-fetch profiles. Or simpler: just add the profile join in a separate query.

  **Simplest approach**: Change the select to also grab from profiles using `.eq` approach, or just do two queries. Actually, the cleanest is to use an RPC or just do a client-side join by fetching profiles for all creator IDs.

  **Final approach**: Fetch tickets as-is, collect unique `created_by` IDs, then fetch their `full_name` from `profiles` table in a second query, and merge on the client. This avoids FK issues.

- Add "Requester" and "PC Name" columns to the `TicketList` table.
- Show requester's `full_name` (fallback to email).
- Show `pc_name` (fallback to "N/A").

### 4. TicketDetail -- Show Requester Name and PC Name

- Fetch the creator's profile (`full_name`) from the `profiles` table using `ticket.created_by`.
- Display requester name prominently in the ticket header.
- Display PC Name in the sidebar "Ticket Details" card.
- Fix the "Back" button to navigate to `/helpdesk` instead of `/`.

### 5. Query Invalidation Fix

- In `CreateTicketDialog`, after successful submission, invalidate the `helpdesk-tickets` query so the list refreshes.

## Technical Details

### Files to modify:
- **New migration SQL** -- Add `pc_name` column, create storage bucket
- **`src/components/helpdesk/CreateTicketDialog.tsx`** -- Add PC name field, add query invalidation on success
- **`src/pages/Helpdesk/index.tsx`** -- Fetch profiles for requester names, pass to TicketList
- **`src/components/helpdesk/TicketList.tsx`** -- Add Requester and PC Name columns, update type
- **`src/pages/Helpdesk/TicketDetail.tsx`** -- Fetch and display requester name, show PC name, fix back button

### Files NOT modified:
- RLS policies (already correct for admin visibility)
- Auth context (no changes needed)
- Attachment components (no changes beyond bucket creation)
