

# Seed 5 Students in STFXSA

Insert 5 sample student records into the `students` table with the following details:

- **School**: `STFXSA` (school_id: `22222222-2222-2222-2222-222222222222`)
- **Academic Year**: `74fb8614-8b9d-49d8-ac4a-7f4c74df201e`

## Sample Students

| Name | LRN | Level | Gender | Age |
|------|-----|-------|--------|-----|
| Maria Santos | 300000000001 | Grade 1 | Female | 7 |
| Juan Dela Cruz | 300000000002 | Grade 2 | Male | 8 |
| Sofia Reyes | 300000000003 | Grade 3 | Female | 9 |
| Miguel Garcia | 300000000004 | Kinder 2 | Male | 6 |
| Isabella Cruz | 300000000005 | Grade 1 | Female | 7 |

## Technical Details

- A single SQL `INSERT` statement will add all 5 records
- Each student will have the `school` text field set to `STFXSA` and the `school_id` UUID set to the STFXSA school ID
- Birth dates will be generated based on approximate ages
- No code changes are needed -- this is a data-only operation

