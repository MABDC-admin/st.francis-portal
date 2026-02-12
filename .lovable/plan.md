
# Phase 3: Real-Time Notifications, Visit Management & Admin Enhancements

## Overview
Add real-time notification system for the registrar dashboard when new registrations arrive, a visit schedule management tab in the Registration Management page, and data export functionality.

---

## 1. Real-Time Notifications for New Registrations

**Concept:** When a new registration is submitted on the public form, the registrar dashboard instantly shows a notification badge and plays a sound alert.

### Database Changes
- Enable Supabase Realtime on `online_registrations` table:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.online_registrations;
  ```

### New file: `src/hooks/useRegistrationNotifications.ts`
- Subscribes to `postgres_changes` on `online_registrations` (INSERT events)
- Maintains an unread count in state
- Plays a short notification sound on new registration
- Provides `unreadCount`, `markAllRead()`, and `newRegistrations` list

### Modify: `src/components/layout/DashboardLayout.tsx`
- Import and use `useRegistrationNotifications` hook
- Add a notification bell icon next to the "Registrations" sidebar item
- Show a red badge with unread count when > 0
- Clicking the badge navigates to registrations tab and marks as read

### New file: `src/components/registration/NotificationBell.tsx`
- Bell icon component with animated badge counter
- Dropdown showing recent registrations (name, level, time ago)
- "View All" link to registrations page

---

## 2. Visit Schedule Management Tab

### Modify: `src/components/registration/RegistrationManagement.tsx`
- Add a 4th tab: "Scheduled Visits"
- Query `school_visits` table joined with `online_registrations` for student name
- Display table with: Visitor Name, Date, Slot (Morning/Afternoon), Status, Student Name (from registration)
- Actions: Mark as Completed, Cancel Visit
- Filter by upcoming vs past visits

---

## 3. Data Export

### Modify: `src/components/registration/RegistrationManagement.tsx`
- Add "Export to CSV" button in each tab header
- Uses the existing `papaparse` dependency to generate CSV
- Exports filtered data (pending, approved, or rejected registrations)
- Includes all relevant fields: student name, LRN, level, religion, address, parent info, status, dates

---

## 4. School Info Admin Management

### New file: `src/components/registration/SchoolInfoManager.tsx`
- Admin form to populate the `school_info` table
- Fields: Registrar Name, Photo URL, Phone, Email, Office Hours
- Map Embed URL input
- Facility photos management (add/remove URLs from JSON array)
- Visit slot configuration (morning/afternoon times, max per slot)
- Save/update to `school_info` table

### Modify: `src/components/registration/RegistrationManagement.tsx`
- Add a 5th tab: "School Info" (admin only)
- Renders the `SchoolInfoManager` component

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/hooks/useRegistrationNotifications.ts` |
| Create | `src/components/registration/NotificationBell.tsx` |
| Create | `src/components/registration/SchoolInfoManager.tsx` |
| Modify | `src/components/registration/RegistrationManagement.tsx` |
| Modify | `src/components/layout/DashboardLayout.tsx` |
| Migration | Enable realtime on `online_registrations` |

---

## Technical Notes

- Realtime subscription uses Supabase channel API with `postgres_changes` event type
- Notification sound uses the Web Audio API (short beep, no external file needed)
- CSV export leverages the already-installed `papaparse` library (`unparse` method)
- The `SchoolInfoManager` uses upsert logic since each school has at most one `school_info` row
- Visit management queries use the existing RLS policies (admin SELECT on `school_visits`)
