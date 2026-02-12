

# Academic Year Selector for Portal Home

## Summary
Create a reusable academic year selector component and place it at the top of every portal home page (Admin, Registrar, Teacher, Finance). Since all data queries already key on `selectedYearId` from the AcademicYearContext, changing the selection will automatically trigger React Query refetches -- no manual refresh logic needed.

---

## What Changes

### 1. Create `AcademicYearSelector` Component
New file: `src/components/dashboard/AcademicYearSelector.tsx`

A compact, styled selector bar that:
- Shows a Select dropdown with all available academic years
- Defaults to the current academic year (pre-selected via context)
- Marks the current year with a badge (e.g., "Current")
- Marks archived years with a lock icon
- Shows the read-only warning inline when a non-current year is selected
- Calls `setSelectedYearId()` from AcademicYearContext on change, which automatically triggers all query refetches since queries include `selectedYearId` in their query keys
- Uses existing Radix UI Select component from the project's UI library

Visual design:
- A horizontal bar with a calendar icon, the label "Academic Year:", and the dropdown
- When a non-current year is selected, shows a subtle amber/yellow indicator: "Viewing historical data (read-only)"
- Smooth transition when switching

### 2. Add Selector to Portal Pages

Insert `<AcademicYearSelector />` at the top of each portal, just below the header:

| Portal | Location |
|--------|----------|
| `AdminPortal.tsx` | After `<DashboardHeader />` |
| `RegistrarPortal.tsx` | After `<DashboardHeader />` |
| `TeacherPortal.tsx` | After the title/header section (dashboard view) |
| `FinancePortal.tsx` | After the title heading |

Each portal already uses queries that include `selectedYearId` in their query keys, so switching the year will automatically re-render all widgets with the correct data.

---

## Technical Details

### Files to Create
- `src/components/dashboard/AcademicYearSelector.tsx`

### Files to Modify
- `src/components/portals/AdminPortal.tsx` -- Add `<AcademicYearSelector />` after header
- `src/components/portals/RegistrarPortal.tsx` -- Add `<AcademicYearSelector />` after header
- `src/components/portals/TeacherPortal.tsx` -- Add `<AcademicYearSelector />` in dashboard view
- `src/components/finance/FinancePortal.tsx` -- Add `<AcademicYearSelector />` after title

### How the Auto-Refresh Works
No manual refresh logic is needed because:
1. `setSelectedYearId()` updates the context state
2. All hooks (e.g., `useStudents`) include `selectedYearId` in their React Query keys
3. React Query automatically refetches when query keys change
4. All portal widgets re-render with the new year's data

### Component Structure
The selector will use:
- `useAcademicYear()` for state and year list
- Radix `Select` for the dropdown
- `Calendar` and `Lock` icons from lucide-react
- `Badge` for "Current" indicator
