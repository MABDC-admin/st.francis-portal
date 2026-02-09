

# Add Fee Templates Management to Connect Fee Setup with Learners

## The Problem

The Fee Setup page correctly manages the **fee catalog** (individual fee items like tuition, books, uniform). However, there is **no UI to create Fee Templates**, which are the bridge between fee items and student assessments.

The database has three tables that form a chain:

```text
fee_catalog (individual fees)
      |
      v
fee_template_items (links fees to a template)
      |
      v
fee_templates (grouped by grade level + academic year)
      |
      v
student_assessments (applied to a specific student)
```

The `fee_templates` and `fee_template_items` tables exist in the database but have **zero UI** -- so staff can create fees but can never bundle them into grade-level templates or assess students against them.

## Solution

Add a **Fee Templates** management section to the Fee Setup page, allowing staff to:

1. Create a template (e.g., "Grade 7 - SY 2024-2025") with a grade level and academic year
2. Add fee catalog items to that template (picking from existing fee_catalog entries)
3. Use that template when assessing students (the StudentAssessments page already has a `template_id` FK)

## Changes

### 1. New File: `src/components/finance/FeeTemplateManager.tsx`

A new component that provides:

- **Template List**: Table showing all fee templates for the current school/academic year, with columns: Name, Grade Level, Strand, Item Count, Total Amount, Active status
- **Create/Edit Template Dialog**: Form with fields for Name, Grade Level (dropdown from known levels), Strand (optional), and a checklist of fee_catalog items with editable amounts
- **Delete Template**: With confirmation
- **Data queries**:
  - Fetch `fee_templates` filtered by `school_id` and `academic_year_id`
  - Fetch `fee_template_items` joined with `fee_catalog` for each template
  - CRUD mutations for both `fee_templates` and `fee_template_items`

### 2. Modified File: `src/components/finance/FeeSetup.tsx`

- Import and render `FeeTemplateManager` below the existing fee catalog table
- Add a visual separator between the two sections
- The page will now have two sections:
  - **Fee Catalog** (existing) -- individual fee items
  - **Fee Templates** (new) -- bundled fee packages by grade level

### 3. Modified File: `src/components/finance/StudentAssessments.tsx`

- Add an **"Assess Student"** button that opens a dialog
- The dialog lets the cashier:
  - Search and select a student
  - Pick a fee template
  - Review the items and amounts
  - Click "Create Assessment" which inserts into `student_assessments` and `assessment_items`
- This connects the template to actual student records

## Technical Details

### FeeTemplateManager Component Structure

```text
FeeTemplateManager
  |-- useQuery: fetch fee_templates (school_id, academic_year_id)
  |-- useQuery: fetch fee_catalog (school_id) for the item picker
  |-- useMutation: create/update fee_templates
  |-- useMutation: create/delete fee_template_items
  |
  |-- UI:
  |     Card "Fee Templates"
  |       Table (name, grade_level, strand, items count, total, actions)
  |       "Add Template" button -> Dialog
  |         - Name input
  |         - Grade Level select
  |         - Strand input (optional)
  |         - Fee items checklist (from fee_catalog)
  |           each item: checkbox + name + editable amount (defaults to catalog amount)
  |         - Total display
  |         - Save button
```

### Assess Student Dialog Structure

```text
AssessStudentDialog
  |-- Student search (name/LRN)
  |-- Template picker (dropdown of active templates matching student grade)
  |-- Items preview table (from fee_template_items)
  |-- "Create Assessment" button
  |     -> INSERT student_assessments (student_id, school_id, academic_year_id, template_id, total_amount, etc.)
  |     -> INSERT assessment_items (one per fee_template_item)
```

### Database

No schema changes needed -- `fee_templates`, `fee_template_items`, `student_assessments`, and `assessment_items` tables all exist with correct columns and foreign keys. RLS policies are already in place for finance/admin roles.

## Summary

- 1 new file: `FeeTemplateManager.tsx`
- 2 modified files: `FeeSetup.tsx`, `StudentAssessments.tsx`
- No database migrations
- Completes the fee-to-student pipeline that was missing its middle layer
