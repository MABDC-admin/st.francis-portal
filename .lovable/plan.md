

# Enhance Student Assessment and Payment Collection

## Overview
Three enhancements to the finance module: (1) hide already-assessed students from the assessment dialog, (2) disable payment collection for fully paid students, and (3) generate a professional PDF billing invoice with school branding after each payment.

---

## 1. Hide Assessed Students from "Assess Student" Dialog

**File:** `src/components/finance/StudentAssessments.tsx`

**Current behavior:** The student search in the Assess Student dialog shows ALL students regardless of whether they already have an active assessment.

**Change:** Filter out students who already have an active (non-closed) assessment for the current academic year.

- Collect all `student_id` values from the current `assessments` array into a Set
- In the student search query, after fetching results, filter out any student whose ID is in that Set
- Alternatively, use `.not('id', 'in', (...assessedIds))` in the Supabase query if IDs are available
- Show a subtle message like "Already assessed" if all search results are filtered out

---

## 2. Disable Payment Collection for Fully Paid Students

**File:** `src/components/finance/PaymentCollection.tsx`

**Current behavior:** When a student is selected and their assessment shows balance = 0 / status = 'paid', the payment form is still shown and active.

**Changes:**
- After selecting a student and loading their assessment, check if `assessment.balance <= 0` or `assessment.status === 'paid'`
- If fully paid, show a green "Fully Paid" banner instead of the payment form fields
- Display a message like "This student's assessment is fully paid. No further payment is needed."
- Disable the "Record Payment" button
- Add a green checkmark visual indicator in the assessment summary section

---

## 3. Generate PDF Billing Invoice After Payment

**File:** `src/components/finance/PaymentCollection.tsx`

**Current behavior:** After payment, a basic thermal-receipt-style printout opens in a new window. There is no proper PDF invoice.

**Changes:** Create a `generateInvoicePDF` function using the existing `jspdf` dependency to produce a professional billing invoice.

### Invoice Layout:
- **Header**: School logo (fetched from `school_settings.logo_url`) + school name centered
- **Title**: "BILLING INVOICE" / "OFFICIAL RECEIPT"
- **Student Info Section**: Name, LRN, Grade Level
- **Payment Details Table**: Date, OR Number, Payment Method, Reference Number, Amount
- **Assessment Summary**: Total Assessed, Total Discounts, Net Amount, Total Paid, Remaining Balance
- **Amount in words** (reuse existing `numberToWords` function)
- **Footer**: "Thank you for your payment!" + timestamp

### Integration:
- Fetch school settings (name + logo_url) using the existing `useSchoolSettings` hook or inline query
- After `recordPayment.onSuccess`, automatically generate and download the PDF
- Also add a "Download Invoice" button on recent payments table rows
- Use `jspdf` (already installed) with `jspdf-autotable` (already installed) for table formatting

---

## Technical Details

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/finance/StudentAssessments.tsx` | Filter assessed students from dialog list |
| `src/components/finance/PaymentCollection.tsx` | Add fully-paid check + disable form + PDF invoice generation |

### Dependencies Used (already installed)
- `jspdf` - PDF generation
- `jspdf-autotable` - Table formatting in PDF

### Data Flow for Invoice
1. Payment recorded successfully, OR number returned
2. Fetch school settings (logo_url, name, address, phone)
3. Build PDF with jsPDF: header with logo image, student info, payment table, balance summary
4. Auto-download PDF as `Invoice-{OR_NUMBER}.pdf`

### Fully Paid Detection Logic
```
const isFullyPaid = selectedAssessment && 
  (Number(selectedAssessment.balance) <= 0 || selectedAssessment.status === 'paid');
```

### Assessed Student Filtering Logic
```
const assessedStudentIds = new Set(assessments.map(a => a.student_id));
const unassessedStudents = students.filter(s => !assessedStudentIds.has(s.id));
```

