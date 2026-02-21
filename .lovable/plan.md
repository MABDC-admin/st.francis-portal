

## Create Public Visit Booking Page at `/visit`

### Overview

Create a new standalone public page at `/visit` that allows anyone to schedule a school visit by selecting a date, time slot, and filling in their details. This page reuses the existing `school_visits` table and slot-capacity logic from `VisitScheduler`, but as a full-page experience (not embedded in a registration flow).

---

### What Gets Built

A new page at `/visit` with:
1. **Branded header** -- matching the style of `/register` (school name, logo icon, "Schedule a Visit" subtitle)
2. **Calendar picker** -- weekdays only, up to 30 days ahead
3. **Morning / Afternoon slot cards** -- showing remaining capacity (max 5 per slot)
4. **Visitor form** -- Name (required), Student Name, Grade Level, Email, Phone, Address
5. **Confirmation view** -- success animation with booking summary after submission

The page fetches the default school (same pattern as `/register`) and inserts into `school_visits` with no authentication required (public-facing).

---

### Files to Create / Modify

| File | Action | Description |
|---|---|---|
| `src/pages/VisitBookingPage.tsx` | **Create** | New standalone page component with calendar, slot picker, visitor form, and confirmation |
| `src/App.tsx` | **Modify** | Add `<Route path="/visit" element={<VisitBookingPage />} />` |

---

### Page Layout

```
Header: [Icon] St. Francis Xavier Smart Academy
        Schedule a School Visit

Body:
  [Calendar -- select a weekday]

  [Morning Card]     [Afternoon Card]
   9AM-12PM           1PM-4PM
   3 slots left        Full

  Visitor Information:
   Name*  |  Student Name
   Grade Level  |  Phone
   Email  |  Address

  [Back to Home]     [Confirm Visit]

Success:
  [Checkmark] Visit Scheduled!
  Summary card with all details
```

### Technical Details

- Reuses the same `school_visits` table and capacity logic (max 5 per slot) from the existing `VisitScheduler`
- Loads the default school using the same pattern as `PublicRegistrationPage` (fetch first school + current academic year)
- Uses the additional visitor columns already in the schema: `visitor_student_name`, `visitor_level`, `visitor_address`, `visitor_birth_date`
- No authentication required -- fully public page
- Calendar uses `pointer-events-auto` class for proper interaction
- Framer Motion animations for slot/form reveal transitions
