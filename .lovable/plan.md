

# Insert 2 STFXSA Grade 5 Students and Auto-Enroll

## Overview

Insert 2 students into STFXSA as Grade 5 learners and auto-enroll them in all 8 Grade 5 subjects.

## Student Data (mapped to our schema)

| Field | Student 1 | Student 2 |
|-------|-----------|-----------|
| LRN | 451503200002 | 404677200006 |
| student_name | SALAZAR, GABRIEL MARTIN CORTEJOS | NOPAL, JULIANA KIONA ANONUEVO |
| level | Grade 5 | Grade 5 |
| gender | Male | Female |
| birth_date | 2015-10-06 | 2015-07-16 |
| age | 10 | 10 |
| mother_maiden_name | CORTEJOS, ROXANNE, BIBAT | ANONUEVO, MELONA, PELESCO |
| father_name | SALAZAR, FIDEL MARTI, MOROT | NOPAL, JONATHAN, MUNEZ |
| phil_address | TINAGO, INOPACAN | GUADALUPE, INOPACAN |
| religion | Christianity | Christianity |
| mother_tongue | Cebuano | Cebuano / Kana / Sinugboanong Bini |
| school | STFXSA | STFXSA |
| school_id | 22222222-2222-2222-2222-222222222222 | 22222222-2222-2222-2222-222222222222 |
| academic_year_id | 74fb8614-... (SY 2025-2026) | 74fb8614-... (SY 2025-2026) |

## Auto-Enrollment: 8 Grade 5 Subjects

Each student will be enrolled in:
1. Filipino
2. English
3. Math
4. Science
5. EPP
6. AP (Araling Panlipunan)
7. MAPEH
8. GMRC

Total: 2 students x 8 subjects = 16 enrollment records.

## Technical Details

- Column mapping from the user's SQL to our schema: `last_name + first_name + middle_name` combined into `student_name`, `current_residence` mapped to `phil_address`, `birthdate` to `birth_date`, `M/F` to `Male/Female`.
- Guardian info (grandmother SALAZAR, GREGORIA, MOROT) is noted but the students table has no guardian column -- only mother/father fields are stored.
- A temporary edge function will be created to perform the insert (since the read-only query tool cannot do writes), then deleted after use.
- The `format_student_text_fields` trigger will auto-format names to Title Case on insert.

