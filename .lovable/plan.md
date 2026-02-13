

# Show Student Details in Visits Table

## Overview
Enhance the Visits table in the Online Registrations management screen to display full student details (name, grade level, address, age, and contact number) instead of just the student name.

## Changes

### File: `src/components/registration/RegistrationManagement.tsx`

**1. Expand the data query (line 97)**
Update the `select` statement for school visits to fetch additional fields from the linked `online_registrations` record:
- `student_name`
- `level` (grade level)
- `current_address` / `phil_address`
- `birth_date` (to calculate age)
- `mobile_number`

**2. Update the Student column in the table (lines 341, 352)**
Replace the single-line student name cell with a richer display showing:
- Student name (bold)
- Grade level
- Address
- Age (calculated from birth_date)
- Contact number

The Student column will show this information stacked vertically in a compact format when a linked registration exists, or a dash when there is none.

## Technical Details

### Query change
```typescript
.select('*, online_registrations(student_name, level, current_address, phil_address, birth_date, mobile_number)')
```

### Age calculation helper
```typescript
const calculateAge = (birthDate: string) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};
```

### Student cell rendering
Replace the simple text cell with a stacked layout showing all details in a compact, readable format using smaller text for secondary information.
