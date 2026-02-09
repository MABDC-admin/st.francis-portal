

# Finance Academic Year Segregation and Carried Balance Strategy

## The Core Question

When a new academic year is created (e.g., 2026-2027), what happens to a student who still owes money from 2025-2026?

## Recommended Approach: Carried Balance Model

Each academic year's financial records stay **completely independent**, but unpaid balances from the previous year are **carried forward as a line item** in the new year's assessment. This is how most Philippine private schools operate.

### How It Works

1. **Every assessment belongs to ONE academic year** -- the existing `academic_year_id` column on `student_assessments` already enforces this.
2. **When a new academic year starts**, the admin/finance user runs a "Year-End Close + Carry Forward" process that:
   - Freezes the old year's financial records (no more payments accepted against old assessments)
   - For each student with a remaining balance, creates a special "Prior Year Balance" line item in their new-year assessment
3. **The new year's assessment shows**: current year fees + carried balance as separate items, so the breakdown is always clear.
4. **Payments in the new year** apply to the new year's assessment (which includes the carried amount). The old year's records remain untouched as historical data.

### Why This Approach

- **Auditability**: Old year records are never modified. You can always see exactly what was owed and paid per year.
- **Simplicity**: Finance staff only work with the current year's assessment. No confusion about which year a payment applies to.
- **Reporting**: Year-end reports are accurate because each year is self-contained.
- **DepEd alignment**: Matches how Philippine school accounting typically works.

### Alternative Considered (and rejected): Cross-Year Payment Linking

An alternative would be to allow payments in 2026-2027 to apply directly to 2025-2026 assessments. This was rejected because:
- It makes reporting extremely complex (which year does revenue belong to?)
- Finance staff would need to constantly switch between years
- Audit trails become confusing

---

## Implementation Plan

### 1. New Database Table: `balance_carry_forwards`

Tracks the carry-forward history so there's a clear audit trail linking old year balance to new year line item.

```sql
CREATE TABLE balance_carry_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  school_id UUID NOT NULL,
  from_academic_year_id UUID NOT NULL,
  to_academic_year_id UUID NOT NULL,
  from_assessment_id UUID NOT NULL,
  to_assessment_id UUID,  -- populated after new assessment is created
  carried_amount NUMERIC NOT NULL DEFAULT 0,
  carried_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  carried_by UUID,  -- user who triggered the carry
  notes TEXT,
  UNIQUE(student_id, from_academic_year_id, to_academic_year_id)
);
```

With RLS for finance and admin roles.

### 2. Year-End Close Process (New Component: `YearEndClose.tsx`)

An admin/finance page that:
- Shows all students with outstanding balances for the selected (old) academic year
- Lets the user preview what will be carried forward
- On confirmation:
  - Marks old assessments as "closed" (add `is_closed BOOLEAN DEFAULT false` to `student_assessments`)
  - For each student with balance > 0:
    - Creates a new assessment in the target academic year (or adds to existing)
    - Adds a "Prior Year Balance (2025-2026)" line item in `assessment_items`
    - Records the carry in `balance_carry_forwards`
  - Logs everything to `finance_audit_logs`

### 3. Schema Changes to `student_assessments`

Add a column to prevent payments against closed/carried assessments:

```sql
ALTER TABLE student_assessments ADD COLUMN is_closed BOOLEAN NOT NULL DEFAULT false;
```

### 4. Assessment Items Enhancement

The existing `assessment_items` table already supports custom line items. Carried balances will appear as:
- `name`: "Prior Year Balance (2025-2026)"
- `fee_catalog_id`: NULL (not from the catalog)
- `is_mandatory`: true
- `amount`: the carried balance amount

### 5. Payment Validation

Update the Cashier (PaymentCollection) to reject payments against closed assessments, showing a message like: "This assessment has been closed. The balance was carried to [new year]."

### 6. Finance Portal Dashboard Updates

- Show carried balance separately in stats: "Current Year Fees" vs "Prior Year Balance"
- Student Ledger shows full history across years with carry-forward links

### 7. Navigation

Add "Year-End Close" under the Finance Settings group, accessible to admin and finance roles.

---

## User Workflow

```text
End of SY 2025-2026:
  1. Finance user goes to "Year-End Close"
  2. Selects source year (2025-2026) and target year (2026-2027)
  3. System shows: 45 students with outstanding balances totaling P234,500
  4. Finance user clicks "Carry Forward All" (or selects specific students)
  5. System creates new assessments in 2026-2027 with carried balance line items
  6. Old assessments marked as closed
  7. Audit log records everything

Start of SY 2026-2027:
  1. Finance user generates new fee assessments for 2026-2027
  2. Students who had carried balances see both: new fees + prior year balance
  3. Payments apply to the combined total
  4. Reports clearly separate current vs carried amounts
```

## Technical Details

### Files to Create
- `src/components/finance/YearEndClose.tsx` -- Year-end close and carry-forward workflow

### Files to Modify
- `src/components/finance/PaymentCollection.tsx` -- Block payments on closed assessments
- `src/components/finance/FinancePortal.tsx` -- Show carried vs current breakdown
- `src/components/finance/StudentAssessments.tsx` -- Show carried items distinctly
- `src/components/layout/DashboardLayout.tsx` -- Add "Year-End Close" nav item
- `src/pages/Index.tsx` -- Wire new tab

### Database Changes
- New table: `balance_carry_forwards` with RLS
- New column on `student_assessments`: `is_closed BOOLEAN DEFAULT false`

