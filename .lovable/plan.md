
# Insert DepEd Subjects for SY 2025-2026 (Both Schools)

## Overview

Insert the complete DepEd subject list from the uploaded image into the `subjects` table, mapped to both school naming conventions:
- **MABDC** uses: Kinder 2, Level 1 through Level 7
- **STFXSA** uses: Kindergarten, Grade 1 through Grade 7

The current subjects table has incomplete/incorrect entries (only Math, English, Filipino, Science per level). These will be replaced with the accurate DepEd curriculum.

## Approach

A single database migration will:
1. **Delete** all existing subjects whose grade_levels overlap with the affected levels (Kinder through Level/Grade 7)
2. **Insert** the correct subjects with `grade_levels` arrays containing BOTH naming conventions so they appear for both schools

## Subject Data (from the image)

| Level | Subjects |
|-------|----------|
| Kinder (Kinder 2 + Kindergarten) | Literacy, Language, and Communication; Socio-Emotional Development; Values Development; Physical Health and Motor Development; Aesthetic/Creative Development; Cognitive Development |
| Grade/Level 1 | Math, GMRC, Language, Reading and Literacy, Makabansa |
| Grade/Level 2 | Filipino, English, Math, Makabansa, GMRC |
| Grade/Level 3 | Filipino, English, Math, Science, Makabansa, GMRC |
| Grade/Level 4-5 | Filipino, English, Math, Science, EPP, AP, MAPEH, GMRC |
| Grade/Level 6 | Filipino, English, Math, Science, AP, TLE, ESP, MAPEH |
| Grade/Level 7 | Filipino, English, Math, Science, AP, TLE, ESP, MAPEH (same as Grade 6, standard DepEd JHS) |

## Technical Details

**Single SQL migration** that:
- Deletes subjects with grade_levels matching Kinder 1, Kinder 2, Kindergarten, Level 1-7, Grade 1-7
- Inserts ~30 new subject rows with proper codes, names, and dual grade_level arrays
- Each subject gets a unique code (e.g., `K-LLC`, `G1-MATH`, `G45-EPP`)
- Grade 4 and 5 share the same subjects, so those entries will have `{'Level 4', 'Level 5', 'Grade 4', 'Grade 5'}` in their grade_levels array
- All subjects set to `is_active = true`, `units = 1`

No code file changes needed -- this is purely a data insertion via migration.
