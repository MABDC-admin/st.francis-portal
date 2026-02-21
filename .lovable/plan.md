

## Add Visit Management to Admin and Registrar Sidebar

### What Changes

A new "Visits" navigation item will be added to the Admin and Registrar sidebar menus, and a dedicated tab entry will be wired up in `Index.tsx` to render the existing visit management UI as a standalone section.

Currently, visit management is buried inside the "Registrations" page as a sub-tab. This change surfaces it as a first-class sidebar item for quick access.

---

### How It Works

When Admin or Registrar clicks "Visits" in the sidebar, it loads a new `VisitManagement` component that reuses all the existing visit logic (fetching from `school_visits`, status updates, delete, upcoming/past filtering) but as a standalone page -- not nested inside a tab.

---

### Files to Modify

| File | What Changes |
|---|---|
| `src/config/dashboardConfig.ts` | Add `{ id: 'visits', icon: ..., label: 'Visits' }` to the "Learner Records" collapsible group for both `admin` and `registrar` roles |
| `src/pages/Index.tsx` | Add `activeTab === 'visits'` condition that renders the new `VisitManagement` component |
| `src/components/registration/VisitManagement.tsx` | **New file** -- standalone visit management component extracted from the visits tab in `RegistrationManagement.tsx`, with the same table, filters, status actions, and delete functionality |

### New Component Details

The `VisitManagement` component will include:
- Header with title and a "Share Visit Link" button (copies the `/visit` URL)
- Upcoming / Past filter toggle
- Table with columns: Visitor, Date, Slot, Student, Grade Level, Age, Address, Mobile, Status, Actions
- Status update buttons (Confirm / Cancel)
- Delete button per row
- Same data fetching pattern using `useSchool`, `useQuery`, and the `school_visits` table

No new database changes or dependencies are needed.
