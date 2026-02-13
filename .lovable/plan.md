

# Show Student Details in Visit Confirmation

## Overview

After a visit is successfully booked, the confirmation screen will display the student's name and address from the linked online registration record.

## Changes

### File: `src/components/registration/VisitScheduler.tsx`

1. **Fetch registration details** -- When `registrationId` is provided, query the `online_registrations` table to get `student_name` and `current_address` (with `phil_address` as fallback).

2. **Display in confirmation screen** -- After the "Visit Scheduled!" heading, show:
   - Student Name
   - Address (current_address or phil_address)
   - Visitor Name, Email, Phone (already captured in state)
   - Visit date and time slot (already shown)

3. **Display in the form area** -- Optionally show a small info card above the calendar reminding the visitor which student the visit is for.

### Technical Details

**Query to add:**
```typescript
const { data: registration } = useQuery({
  queryKey: ['registration-details', registrationId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('online_registrations')
      .select('student_name, current_address, phil_address')
      .eq('id', registrationId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  enabled: !!registrationId,
});
```

**Confirmation screen additions:**
- "Student: {registration.student_name}" 
- "Address: {registration.current_address || registration.phil_address}"
- Visitor name, email, and phone from form state

The confirmation will display all details in a clean summary card format before the dialog auto-closes after 3 seconds.

