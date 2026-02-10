# Payment Processing System

<cite>
**Referenced Files in This Document**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx)
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx)
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx)
- [FeeSetup.tsx](file://src/components/finance/FeeSetup.tsx)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx)
- [types.ts](file://src/integrations/supabase/types.ts)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql)
- [20260210120000_grant_stfxsa_finance_access.sql](file://supabase/migrations/20260210120000_grant_stfxsa_finance_access.sql)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)

## Introduction
This document describes the payment processing system within the st.francis-portal application. It covers payment collection workflows, installment payment plans, online payment processing, validation, reconciliation, cash flow management, learner payment interfaces, payment tracking, automated reminders, and integration with accounting systems. The system is built with React, TypeScript, Supabase for backend/data, and integrates with real-time query libraries for efficient data synchronization.

## Project Structure
The payment processing system is organized around several finance-focused components under the `src/components/finance/` directory. These components collaborate with Supabase-defined tables and migrations to manage assessments, payments, receipts, and reporting.

```mermaid
graph TB
subgraph "Finance Components"
PC["PaymentCollection.tsx"]
PP["PaymentPlans.tsx"]
FL["FinanceLearnerPage.tsx"]
SL["StudentLedger.tsx"]
FP["FinancePortal.tsx"]
FR["FinanceReports.tsx"]
FS["FeeSetup.tsx"]
FSet["FinanceSettings.tsx"]
end
subgraph "Supabase Integration"
Types["types.ts (Database Types)"]
Audit["audit_logs.sql (Migration)"]
Access["grant_stfxsa_finance_access.sql (Migration)"]
end
PC --> Types
PP --> Types
FL --> Types
SL --> Types
FP --> Types
FR --> Types
FS --> Types
FSet --> Types
Types --> Audit
Types --> Access
```

**Diagram sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L1-L854)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L1-L444)
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx#L1-L284)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx#L1-L193)
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx#L1-L100)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L1-L322)
- [FeeSetup.tsx](file://src/components/finance/FeeSetup.tsx#L1-L162)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L1-L185)
- [types.ts](file://src/integrations/supabase/types.ts#L1-L4078)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)
- [20260210120000_grant_stfxsa_finance_access.sql](file://supabase/migrations/20260210120000_grant_stfxsa_finance_access.sql#L1-L70)

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L1-L854)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L1-L444)
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx#L1-L284)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx#L1-L193)
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx#L1-L100)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L1-L322)
- [FeeSetup.tsx](file://src/components/finance/FeeSetup.tsx#L1-L162)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L1-L185)
- [types.ts](file://src/integrations/supabase/types.ts#L1-L4078)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)
- [20260210120000_grant_stfxsa_finance_access.sql](file://supabase/migrations/20260210120000_grant_stfxsa_finance_access.sql#L1-L70)

## Core Components
- Payment Collection: Handles real-time cash and non-cash payments, receipt numbering, and immediate assessment updates.
- Payment Plans: Creates and manages installment plans with grace periods and late fees.
- Finance Learner Page: Provides learner financial summaries and filters.
- Student Ledger: Offers detailed student account views with payment histories.
- Finance Portal: Displays high-level financial statistics and quick actions.
- Finance Reports: Generates analytics and charts for collections, balances, and trends.
- Fee Setup: Manages fee catalog items and templates.
- Finance Settings: Configures payment defaults, receipts, late fees, convenience fees, and clearance thresholds.

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L133-L854)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L48-L444)
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx#L18-L284)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx#L90-L193)
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx#L14-L100)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L15-L322)
- [FeeSetup.tsx](file://src/components/finance/FeeSetup.tsx#L20-L162)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L16-L185)

## Architecture Overview
The system follows a component-driven architecture with Supabase as the backend. Components use React Query for data fetching and mutations, maintain local state for forms and dialogs, and integrate with Supabase tables for persistence. Real-time updates are supported via reactive queries and optimistic UI patterns.

```mermaid
graph TB
subgraph "UI Layer"
Cashier["PaymentCollection.tsx"]
Plans["PaymentPlans.tsx"]
Learners["FinanceLearnerPage.tsx"]
Ledger["StudentLedger.tsx"]
Portal["FinancePortal.tsx"]
Reports["FinanceReports.tsx"]
Fees["FeeSetup.tsx"]
Settings["FinanceSettings.tsx"]
end
subgraph "Data Layer"
Supabase["Supabase Client"]
Types["types.ts"]
end
subgraph "Database"
Payments["payments"]
Assessments["student_assessments"]
PlansTbl["payment_plans"]
Installments["payment_plan_installments"]
FinanceSettingsTbl["finance_settings"]
FeeCatalog["fee_catalog"]
AuditLogs["audit_logs"]
end
Cashier --> Supabase
Plans --> Supabase
Learners --> Supabase
Ledger --> Supabase
Portal --> Supabase
Reports --> Supabase
Fees --> Supabase
Settings --> Supabase
Supabase --> Payments
Supabase --> Assessments
Supabase --> PlansTbl
Supabase --> Installments
Supabase --> FinanceSettingsTbl
Supabase --> FeeCatalog
Supabase --> AuditLogs
```

**Diagram sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L1-L854)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L1-L444)
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx#L1-L284)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx#L1-L193)
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx#L1-L100)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L1-L322)
- [FeeSetup.tsx](file://src/components/finance/FeeSetup.tsx#L1-L162)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L1-L185)
- [types.ts](file://src/integrations/supabase/types.ts#L2347-L2450)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)

## Detailed Component Analysis

### Payment Collection Workflow
The payment collection component enables cashier staff to accept payments, validate inputs, generate receipts, and reconcile with student assessments.

```mermaid
sequenceDiagram
participant Cashier as "Cashier UI"
participant PC as "PaymentCollection.tsx"
participant SB as "Supabase"
participant Assess as "student_assessments"
participant Payments as "payments"
participant Settings as "finance_settings"
Cashier->>PC : "Search student and select assessment"
Cashier->>PC : "Enter amount, method, reference, date"
PC->>SB : "Validate amount and method"
PC->>SB : "Fetch finance_settings (receipt numbering)"
SB-->>PC : "Settings (format, next number)"
PC->>SB : "Insert payment record"
SB-->>PC : "Payment inserted"
PC->>SB : "Update assessment totals (total_paid, balance, status)"
SB-->>PC : "Assessment updated"
PC->>SB : "Increment receipt number sequence"
SB-->>PC : "Sequence updated"
PC-->>Cashier : "Success toast and receipt print"
```

**Diagram sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L234-L299)
- [types.ts](file://src/integrations/supabase/types.ts#L2347-L2450)

Key behaviors:
- Payment validation enforces positive amounts, selected student, active assessment, and required reference for non-cash methods.
- Receipt numbering uses configurable format and increments atomically.
- Assessment totals are recalculated and status updated (pending/partial/paid).
- Receipt printing displays current balance and payment details.

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L133-L854)
- [types.ts](file://src/integrations/supabase/types.ts#L2347-L2450)

### Installment Payment Plans
The payment plans component creates structured installment schedules with grace periods and optional late fees.

```mermaid
flowchart TD
Start(["Create Plan"]) --> Validate["Validate student and assessment"]
Validate --> Generate["Generate installments<br/>- Equal per-installment<br/>- Adjust last to balance total"]
Generate --> Grace["Apply grace period days"]
Grace --> LateFee{"Late fee enabled?"}
LateFee --> |Yes| ApplyFee["Apply fixed/percentage/per-day fee"]
LateFee --> |No| SkipFee["No late fee"]
ApplyFee --> SavePlan["Insert payment_plans row"]
SkipFee --> SavePlan
SavePlan --> SaveInst["Insert payment_plan_installments rows"]
SaveInst --> Done(["Plan Ready"])
```

**Diagram sources**
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L24-L46)
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L151-L192)
- [types.ts](file://src/integrations/supabase/types.ts#L2248-L2310)

**Section sources**
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L48-L444)
- [types.ts](file://src/integrations/supabase/types.ts#L2248-L2310)

### Online Payment Processing
Online payment processing is supported through non-cash payment methods requiring reference numbers. The system validates reference presence for bank transfers, e-wallets, and card payments.

Validation logic:
- Non-cash methods require a reference number.
- Amount must be greater than zero.
- Active assessment must exist for the selected student and academic year.

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L234-L242)

### Payment Validation and Reconciliation
Validation and reconciliation are enforced during payment recording and edits:

- Recording a payment:
  - Validates amount and method.
  - Requires reference number for non-cash.
  - Updates assessment totals and status.
  - Increments receipt number sequence.

- Editing a payment:
  - Voids the original payment.
  - Generates a new receipt number.
  - Inserts corrected payment.
  - Recalculates assessment totals.

- Deleting a payment:
  - Requires finance/admin role.
  - Voids payment and reverses assessment totals.
  - Logs deletion in audit logs.

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L301-L376)
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L378-L465)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)

### Cash Flow Management
Cash flow is tracked through:
- Verified payments contributing to total collections.
- Outstanding balances per student and school.
- Daily collections trend and cumulative charts.
- Clearance thresholds and auto-clearance settings.

**Section sources**
- [FinancePortal.tsx](file://src/components/finance/FinancePortal.tsx#L18-L42)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L26-L122)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L72-L104)

### Learner Payment Interface and Tracking
Learner-facing and administrative tracking features:
- Learner summary cards show assessed, collected, and outstanding amounts.
- Student ledger expands to show payment history with statuses and void reasons.
- Recent payments table shows verification status and actions (edit/delete/print).

**Section sources**
- [FinanceLearnerPage.tsx](file://src/components/finance/FinanceLearnerPage.tsx#L18-L284)
- [StudentLedger.tsx](file://src/components/finance/StudentLedger.tsx#L90-L193)
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L522-L586)

### Automated Payment Reminders
While explicit reminder automation is not implemented in the provided components, the system supports:
- Installment plans with due dates and grace periods.
- Late fee configurations for overdue installments.
- Reporting on overdue students and payment status distribution.

These features can be extended to trigger reminders based on due dates and grace periods.

**Section sources**
- [PaymentPlans.tsx](file://src/components/finance/PaymentPlans.tsx#L48-L444)
- [FinanceReports.tsx](file://src/components/finance/FinanceReports.tsx#L15-L322)
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L72-L104)

### Integration with Accounting Systems
Integration touchpoints:
- Receipt numbering and formats stored in finance settings.
- Audit logging for payment deletions and corrections.
- Financial reporting tables (payments, assessments, plans) support external analytics.

**Section sources**
- [FinanceSettings.tsx](file://src/components/finance/FinanceSettings.tsx#L72-L104)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)
- [types.ts](file://src/integrations/supabase/types.ts#L2347-L2450)

## Dependency Analysis
The components depend on Supabase tables and typed definitions. Key relationships:
- payments → student_assessments (assessment_id)
- payment_plans → student_assessments (assessment_id)
- payment_plan_installments → payment_plans (plan_id)
- finance_settings → schools (school_id)
- fee_catalog → schools (school_id)

```mermaid
erDiagram
STUDENT_ASSESSMENTS {
uuid id PK
uuid student_id FK
uuid school_id FK
uuid academic_year_id FK
number total_amount
number total_paid
number balance
string status
}
PAYMENTS {
uuid id PK
uuid student_id FK
uuid assessment_id FK
uuid school_id FK
uuid academic_year_id FK
number amount
string payment_method
string reference_number
string or_number
string receipt_type
date payment_date
string status
uuid received_by
}
PAYMENT_PLANS {
uuid id PK
uuid student_id FK
uuid assessment_id FK
uuid school_id FK
string plan_type
integer total_installments
integer grace_period_days
number late_fee_amount
string late_fee_type
uuid created_by
}
PAYMENT_PLAN_INSTALLMENTS {
uuid id PK
uuid plan_id FK
integer installment_number
date due_date
number amount
number paid_amount
string status
}
FINANCE_SETTINGS {
uuid id PK
uuid school_id FK
uuid academic_year_id FK
string or_number_format
integer or_next_number
string ar_number_format
integer ar_next_number
string default_payment_terms
boolean late_fee_enabled
string late_fee_type
number late_fee_amount
string convenience_fee_mode
number convenience_fee_amount
number clearance_threshold
boolean auto_clearance
}
FEE_CATALOG {
uuid id PK
uuid school_id FK
string name
string description
string category
number amount
boolean is_mandatory
boolean is_recurring
}
STUDENT_ASSESSMENTS ||--o{ PAYMENTS : "has"
PAYMENT_PLANS ||--o{ PAYMENT_PLAN_INSTALLMENTS : "generates"
FINANCE_SETTINGS ||--|| SCHOOL : "belongs_to"
FEE_CATALOG ||--|| SCHOOL : "belongs_to"
```

**Diagram sources**
- [types.ts](file://src/integrations/supabase/types.ts#L2248-L2450)

**Section sources**
- [types.ts](file://src/integrations/supabase/types.ts#L2248-L2450)

## Performance Considerations
- Use paginated and filtered queries to limit data transfer.
- Cache frequently accessed data (e.g., recent payments, learner lists) with React Query invalidation.
- Batch updates for receipt numbering and assessment totals to minimize round trips.
- Optimize rendering by expanding only necessary ledger rows and deferring heavy computations until data is available.

## Troubleshooting Guide
Common issues and resolutions:
- Payment validation errors: Ensure amount > 0, student selected, active assessment exists, and reference provided for non-cash methods.
- Receipt numbering gaps: Verify finance settings format and sequence values; increment atomically.
- Edit/Delete permission denied: Confirm user has finance or admin role; check audit logs for deletion entries.
- Missing assessment data: Confirm academic year context and school selection; ensure assessments are not closed.

**Section sources**
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L234-L242)
- [PaymentCollection.tsx](file://src/components/finance/PaymentCollection.tsx#L301-L317)
- [20260209100000_create_audit_logs.sql](file://supabase/migrations/20260209100000_create_audit_logs.sql#L1-L38)

## Conclusion
The payment processing system provides a robust foundation for collecting payments, managing installment plans, tracking cash flow, and generating financial insights. Its modular components, Supabase-backed data model, and audit capabilities support both operational efficiency and compliance. Extending the system with automated reminders and deeper accounting integrations can further enhance its capabilities.