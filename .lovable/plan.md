

# Add Payment Collection UI to Cashier Dashboard

## The Problem

The Cashier Dashboard (`PaymentCollection.tsx`) currently only shows a **read-only table** of recent payments. Although the code contains a `form` state and a `recordPayment` mutation, there is **no UI** to actually collect a payment -- no button, no dialog, no student search, no payment form. The cashier literally cannot record a payment.

## Solution

Add a **"Collect Payment"** button and dialog that follows this flow:

1. Search and select a student (by name or LRN)
2. View the student's active assessment and outstanding balance
3. Enter payment amount, method, reference number, and notes
4. Submit to record the payment and update the assessment balance

## Changes

### Modified File: `src/components/finance/PaymentCollection.tsx`

Add the following to the existing component:

**1. "Collect Payment" button** in the page header (next to the title)

**2. Payment Dialog** containing:
- **Student Search**: Text input to search students by name/LRN (queries `students` table filtered by `school_id`)
- **Student selector**: Clickable list of matching students
- **Assessment display**: Once a student is selected, fetch their active `student_assessments` record showing total, paid, and balance
- **Payment form**:
  - Amount input (pre-filled with outstanding balance, editable)
  - Payment method dropdown (cash, bank deposit, online transfer, e-wallet, card)
  - Reference number input (optional, required for non-cash methods)
  - Notes textarea (optional)
- **Submit button**: Calls the existing `recordPayment` mutation

**3. Post-payment update**: After inserting the payment, also update the `student_assessments` record:
- Increment `total_paid` by the payment amount
- Recalculate `balance` (net_amount - new total_paid)
- Update `status` to 'partial' or 'paid' based on remaining balance

**4. Receipt number generation**: Query `finance_settings` for the current OR/AR sequence number, assign it to the payment, and increment the counter.

### Data Queries Added
- Search `students` by name/LRN within the school
- Fetch `student_assessments` for the selected student (active, current academic year)
- Fetch `finance_settings` for receipt numbering
- Update `student_assessments` totals after payment

### No Database Changes
All required tables and columns already exist: `payments`, `student_assessments`, `students`, `finance_settings`.

## Technical Details

### Payment Recording Flow
```text
User clicks "Collect Payment"
  -> Dialog opens
  -> Search student (students table, school_id filter)
  -> Select student
  -> Fetch active assessment (student_assessments, is_closed=false)
  -> Show balance info
  -> Fill payment details (amount, method, reference, notes)
  -> Click "Record Payment"
     -> INSERT into payments (student_id, assessment_id, amount, method, etc.)
     -> UPDATE student_assessments (total_paid += amount, balance -= amount, status)
     -> Fetch & increment OR number from finance_settings
     -> Invalidate queries
     -> Show success toast with OR number
```

### Assessment Status Logic
```text
if balance <= 0 -> status = 'paid'
if balance > 0 && total_paid > 0 -> status = 'partial'  
if total_paid == 0 -> status = 'pending'
```

## Summary
- 1 modified file: `PaymentCollection.tsx`
- No new files, no database migrations
- Adds the missing payment collection form that connects the cashier to student assessments
