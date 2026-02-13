

# Integrate Visit Scheduling into Registration Flow

## Overview
Move the school visit option directly into the registration wizard as a new Step 4 (after Agreement, before Review & Submit). This ensures every visit is automatically linked to its registration record.

## New Registration Flow (5 steps)
1. Student Information
2. Parent & Address
3. Agreement
4. **School Visit (NEW)** -- "Would you like to visit the school?" Yes/No toggle. If Yes, show school gallery, map, and date/slot picker inline.
5. Review & Submit

## Changes

### File: `src/components/registration/OnlineRegistrationForm.tsx`

**1. Update step labels (line 31)**
Change from 4 steps to 5:
```
['Student Information', 'Parent & Address', 'Agreement', 'School Visit', 'Review & Submit']
```

**2. Add visit-related state**
- `wantsVisit` (boolean) -- whether user wants to schedule a visit
- `visitDate` (Date or undefined)
- `visitSlot` ('morning' | 'afternoon' | '')
- `visitorName` (string) -- pre-filled from parent name

**3. Fetch school info and visit capacity data**
- Query `school_info` for photos, map, registrar info (same as SchoolShowcaseDialog)
- Query `school_visits` for existing slot counts to show availability

**4. New Step 3 UI: School Visit**
- Radio/switch: "Would you like to visit the school before enrollment?"
- If Yes:
  - Photo gallery (reuse the carousel logic from SchoolShowcaseDialog)
  - Google Maps embed
  - Calendar date picker (weekdays only, next 30 days)
  - Morning/Afternoon slot cards with availability
  - Visitor name field (pre-filled with mother/father name)
- If No: just show a message and Next button

**5. Update step validation (validateStep function)**
- Step 3 (visit): If `wantsVisit` is true, require `visitDate`, `visitSlot`, and `visitorName`
- Shift existing Review step validation to step 4

**6. Update handleSubmit to link visit to registration**
- Insert registration first, capturing the returned `id`
- If `wantsVisit`, insert into `school_visits` with that `registration_id`
- Both inserts happen in sequence before showing success

**7. Update Review step (now step 4)**
- Add a "School Visit" review card showing visit date, slot, and visitor name (or "No visit scheduled")
- Shift step index references (review is now step 4)

**8. Remove post-success visit scheduling**
- Remove the "View School Info & Schedule Visit" button from the success screen since it's now part of the flow
- Remove the SchoolShowcaseDialog import and usage (no longer needed in this component)

### File: `src/components/registration/VisitScheduler.tsx`
No changes needed -- the inline visit step will use its own simpler implementation directly in the form.

### File: `src/components/registration/SchoolShowcaseDialog.tsx`
No changes needed -- it remains available for use elsewhere (e.g., admin side), but is no longer imported by the registration form.

## Technical Details

### Registration + Visit Insert (in handleSubmit)
```typescript
// 1. Insert registration and get ID
const { data: regData, error: regError } = await supabase
  .from('online_registrations')
  .insert([{ ...registrationPayload }])
  .select('id')
  .single();

// 2. If visit was requested, insert visit linked to registration
if (wantsVisit && regData?.id) {
  await supabase.from('school_visits').insert([{
    school_id: schoolId,
    registration_id: regData.id,
    visitor_name: visitorName,
    visit_date: format(visitDate, 'yyyy-MM-dd'),
    visit_slot: visitSlot,
    status: 'scheduled',
  }]);
}
```

### Visit Capacity Check
```typescript
// Fetch existing visits for slot availability
const { data: existingVisits } = await supabase
  .from('school_visits')
  .select('visit_date, visit_slot')
  .eq('school_id', schoolId)
  .eq('status', 'scheduled')
  .gte('visit_date', format(today, 'yyyy-MM-dd'));
```

This ensures every visit in the database is always linked to a registration, which fixes the empty "Student" column issue in the Visits management table.

