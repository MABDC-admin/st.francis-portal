

# Add Payment Date Field to Payment Collection

## Problem
The "Collect Payment" dialog has no date picker. All payments are recorded with today's date automatically. Cashiers need to enter previous collection dates for proper timestamping (e.g., recording payments received yesterday or over the weekend).

## Solution
Add a "Payment Date" field (defaulting to today) to both the Collect Payment and Edit Payment dialogs. The selected date will be saved as `payment_date` in the database insert.

## Technical Details

### File: `src/components/finance/PaymentCollection.tsx`

**1. Add date import**
- Import `CalendarIcon` from lucide-react
- Import `Popover, PopoverContent, PopoverTrigger` from UI
- Import `Calendar` component
- Import `format` from date-fns

**2. Add `payment_date` to form state**
- `paymentForm`: add `payment_date: new Date().toISOString().split('T')[0]` (today as default)
- `editForm`: same default
- `resetDialog`: reset date back to today

**3. Add date picker UI in Collect Payment dialog (after Amount field, around line 510)**
- Label: "Payment Date"
- A date input or calendar popover so the cashier can pick a past date
- Default: today's date

**4. Add date picker UI in Edit Payment dialog (around line 562)**
- Same date field for corrections

**5. Pass date to database insert**
- In `recordPayment` mutation (line 209): add `payment_date: paymentForm.payment_date`
- In `editPayment` mutation (line 287): add `payment_date: editForm.payment_date`

**6. Update `openEditDialog`** to pre-fill the original payment's date

### Files to Change

| File | Change |
|------|--------|
| `src/components/finance/PaymentCollection.tsx` | Add payment_date to form state, add date input to both dialogs, pass date on insert |

