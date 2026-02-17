

## Fix: Drop NOT NULL constraint on `student_grades.school_id`

The `school_id` column on `student_grades` is currently `NOT NULL`, which causes inserts to fail when the school context isn't resolved. The user has requested to make this column nullable.

### Database Migration

Run a single SQL migration:

```sql
ALTER TABLE public.student_grades ALTER COLUMN school_id DROP NOT NULL;
```

### RLS Policies (No Changes Needed)

The existing RLS policies on `student_grades` are role-based (admin, registrar, teacher) and student-ownership-based -- none reference `school_id`, so dropping the NOT NULL constraint won't break any policy logic.

| Item | Detail |
|------|--------|
| Table | `public.student_grades` |
| Column | `school_id` |
| Change | `NOT NULL` to nullable |
| RLS impact | None -- no policies reference `school_id` |

