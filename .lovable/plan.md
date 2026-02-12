

# DepEd K-12 Curriculum Alignment Update

## Summary
Standardize all grade level references across the entire application to match the official DepEd K-12 curriculum framework. This involves updating ~15 files that define or use grade level constants, fixing strand support for SHS (Grade 11-12), and seeding DepEd Matatag-compliant subjects into the database.

---

## What Changes

### 1. Centralize Grade Level Constants
The constants file (`src/components/enrollment/constants.ts`) already has the correct DepEd structure. The problem is that **many other files define their own outdated grade level arrays** instead of importing from this central source.

**Files with outdated local GRADE_LEVELS arrays that will be updated to import from `constants.ts`:**

| File | Current Values | Fix |
|------|---------------|-----|
| `AttendanceManagement.tsx` | `Kinder 1, Kinder 2, Grade 1...` | Import from constants |
| `ExamScheduleManagement.tsx` | `Kinder 1, Kinder 2, Grade 1...` | Import from constants |
| `ScheduleManagement.tsx` | `Kinder 1, Kinder 2, Grade 1...` | Import from constants |
| `EnrollmentManagement.tsx` | `Kinder 1, Kinder 2, Level 1...Level 12` | Import from constants |
| `PromoteStudentsWorkflow.tsx` | `Kinder 1, Kinder 2, Grade 1...` | Import from constants |
| `StudentFormModal.tsx` | `Level 1...Level 6` | Import from constants |
| `FeeTemplateManager.tsx` | `Kinder, Grade 1...` | Import from constants |
| `reportTypes.ts` | `Kinder, Grade 1...` | Import from constants |
| `CSVImport.tsx` | Default `Level 1` | Default to `Kindergarten` |

### 2. Fix the Central Constants File
Update `src/components/enrollment/constants.ts`:
- Remove `LEGACY_GRADE_LEVELS` (no longer needed as a separate export -- legacy mapping will be handled by a normalization function)
- Add a `normalizeGradeLevel()` helper function that converts old formats (`Level 1` to `Grade 1`, `Kinder 1`/`Kinder 2` to `Kindergarten`) for backward compatibility with existing data

### 3. Student Form Modal Overhaul
Update `src/components/students/StudentFormModal.tsx`:
- Replace the old `Level 1-6` dropdown with full DepEd grade levels
- Add strand selection dropdown that appears when Grade 11 or 12 is selected
- Add `strand` field to the form data

### 4. Promotion Workflow Fix
Update `src/components/curriculum/PromoteStudentsWorkflow.tsx`:
- Update `GRADE_ORDER` to start with `Kindergarten` instead of `Kinder 1, Kinder 2`
- Update `getNextLevel()` to handle the normalized grade progression

### 5. Seed DepEd Matatag Subjects into Database
Insert subjects into the `subjects` table aligned with the Matatag curriculum:

**Kindergarten:** Language, Numeracy, Socio-Emotional Development

**Elementary (Grades 1-6):** Filipino, English, Mathematics, Science (Gr 3-6), Araling Panlipunan, MAPEH, Edukasyon sa Pagpapakatao (EsP), Mother Tongue (Gr 1-3), Technology and Livelihood Education (TLE, Gr 4-6)

**Junior High School (Grades 7-10):** Filipino, English, Mathematics, Science, Araling Panlipunan, MAPEH, EsP, TLE

**Senior High School Core (Grades 11-12):** Oral Communication, Komunikasyon at Pananaliksik, General Mathematics, Earth and Life Science, Physical Science, Personal Development, Understanding Culture Society and Politics, Contemporary Philippine Arts, Physical Education and Health, Media and Information Literacy, 21st Century Literature, Introduction to Philosophy

**SHS Strand-Specific (samples):**
- STEM: General Biology, General Chemistry, General Physics, Calculus, Statistics
- ABM: Business Mathematics, Fundamentals of ABM, Business Finance
- HUMSS: Creative Writing, Philippine Politics, Community Engagement
- GAS: Humanities, Social Sciences, Organization and Management

### 6. Add Strand Support to Admissions Form
The `admissions` table already has a `strand` column. Ensure the admission review UI displays strand info for SHS applicants.

---

## Technical Details

### Files to Modify (approx. 15 files)

```text
src/components/enrollment/constants.ts          -- Add normalizeGradeLevel(), clean up
src/components/management/AttendanceManagement.tsx  -- Import GRADE_LEVELS from constants
src/components/management/ExamScheduleManagement.tsx -- Import GRADE_LEVELS from constants
src/components/management/ScheduleManagement.tsx    -- Import GRADE_LEVELS from constants
src/components/curriculum/EnrollmentManagement.tsx   -- Import GRADE_LEVELS from constants
src/components/curriculum/PromoteStudentsWorkflow.tsx -- Fix GRADE_ORDER, use Kindergarten
src/components/students/StudentFormModal.tsx          -- Full grade levels + strand support
src/components/finance/FeeTemplateManager.tsx        -- Import GRADE_LEVELS from constants
src/components/reports/reportTypes.ts                -- Import GRADE_LEVELS from constants
src/components/import/CSVImport.tsx                  -- Default to 'Kindergarten', add normalization
src/types/student.ts                                 -- Add strand to StudentFormData
```

### Database Changes

1. **Subjects table seed** -- Insert ~40+ DepEd Matatag subjects with proper `grade_levels` arrays
2. **No schema changes needed** -- The `students` table already has a `strand` column, `subjects` table already has `grade_levels` array column

### Backward Compatibility
- A `normalizeGradeLevel()` function will convert legacy formats on display/query
- Existing student records with `Level X` or `Kinder X` formats will still work; the normalization function handles them transparently
- No data migration required -- legacy values are handled at the application layer

