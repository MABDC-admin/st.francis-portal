
# Sort Academic Years in Ascending Order

## Summary
Change the sort order of academic years from descending (`newest first`) to ascending (`oldest first`) in two locations.

## Changes

### File 1: `src/contexts/AcademicYearContext.tsx` (line 57)
Change `.order('start_date', { ascending: false })` to `.order('start_date', { ascending: true })`.

This affects the global context used by the sidebar year selector and all portal pages.

### File 2: `src/components/finance/YearEndClose.tsx` (line 37)
Change `.order('start_date', { ascending: false })` to `.order('start_date', { ascending: true })`.

This affects the year-end close finance component which fetches its own list of academic years.

No other files need changes -- the dropdown menus and lists render years in the order returned by these queries.
