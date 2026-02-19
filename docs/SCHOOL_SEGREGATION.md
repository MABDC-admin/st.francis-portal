# School-Academic Year Data Segregation System

## Overview

This system ensures complete data isolation between schools and their respective academic years, preventing any cross-contamination of data across the application.

## Architecture

### Database Level

#### 1. Composite Indexes
Optimized queries that filter by both `school_id` and `academic_year_id`:
- `idx_students_school_year`
- `idx_grades_school_year`
- `idx_attendance_school_year`
- `idx_raw_scores_school_year`
- `idx_enrollments_school_year`

#### 2. Validation Triggers
Automatic validation on INSERT/UPDATE operations:
```sql
validate_school_academic_year()
```
This function ensures that the `academic_year_id` belongs to the same school as specified in `school_id`.

**Error Example:**
```
Data segregation violation: Academic year abc-123 belongs to school xyz-789, 
but record specifies school def-456
```

### Application Level

#### 1. Query Helper Utilities (`src/utils/schoolYearQuery.ts`)

**SchoolYearQueryBuilder** - Automatic filter application:
```typescript
import { useSchoolYearQuery } from '@/utils/schoolYearQuery';

// In a React component
const studentQuery = useSchoolYearQuery('students');

// All queries automatically filtered by school + academic year
const { data } = await studentQuery.select('*').eq('level', 'Grade 1');

// Inserts automatically include school_id and academic_year_id
await studentQuery.insert({ student_name: 'John Doe', lrn: '123456' });
```

**Benefits:**
- ✅ Automatic filter application
- ✅ Type-safe operations
- ✅ Prevents accidental cross-school queries
- ✅ Centralized error handling

#### 2. Context Validation

The system validates that school and academic year context is always available:
```typescript
validateSchoolContext(schoolId, academicYearId);
// Throws SchoolContextError if either is missing
```

## Usage Guide

### React Components

```typescript
import { useSchoolYearQuery } from '@/utils/schoolYearQuery';

function StudentList() {
  const studentQuery = useSchoolYearQuery<Student>('students');
  
  // SELECT - automatically filtered
  const { data: students } = await studentQuery
    .select('*')
    .eq('level', 'Grade 1')
    .order('student_name');
  
  // INSERT - school_id and academic_year_id added automatically
  const handleAddStudent = async (studentData) => {
    await studentQuery.insert(studentData);
  };
  
  // UPDATE - only updates records in current school-year
  const handleUpdateStudent = async (id, updates) => {
    await studentQuery.update(updates).eq('id', id);
  };
  
  // DELETE - only deletes records in current school-year
  const handleDeleteStudent = async (id) => {
    await studentQuery.delete().eq('id', id);
  };
}
```

### Server-Side / API Routes

```typescript
import { createSchoolYearQuery } from '@/utils/schoolYearQuery';

export async function getStudents(schoolId: string, academicYearId: string) {
  const query = createSchoolYearQuery('students', schoolId, academicYearId);
  return await query.select('*');
}
```

### Manual Queries (When Necessary)

If you need to bypass the helper for specific cases:
```typescript
import { createSchoolYearFilter } from '@/utils/schoolYearQuery';

const filters = createSchoolYearFilter(schoolId, academicYearId);

const { data } = await supabase
  .from('students')
  .select('*')
  .match(filters)  // Applies both school_id and academic_year_id
  .eq('level', 'Grade 1');
```

## Verification

### Running Verification Script

Execute the verification script in Supabase SQL Editor:
```sql
-- File: supabase/migrations/verify_segregation.sql
```

**Expected Results:**
- ✅ All violation counts = 0
- ✅ Index count = 5
- ✅ Trigger count = 5
- ✅ Query plans show index usage

### Manual Testing Checklist

1. **School Switching Test**
   - [ ] Login as School A
   - [ ] Verify only School A data visible
   - [ ] Switch to School B
   - [ ] Verify only School B data visible
   - [ ] Confirm no School A data appears

2. **Academic Year Switching Test**
   - [ ] Select Year 2024-2025
   - [ ] Verify only 2024-2025 data visible
   - [ ] Switch to Year 2025-2026
   - [ ] Verify only 2025-2026 data visible

3. **Insert Validation Test**
   - [ ] Attempt to insert student with mismatched school-year
   - [ ] Verify trigger blocks the operation
   - [ ] Confirm error message is clear

4. **Query Performance Test**
   - [ ] Run EXPLAIN ANALYZE on student queries
   - [ ] Verify composite index is used
   - [ ] Check query execution time is acceptable

## Edge Cases Handled

### 1. Overlapping Academic Years
Both schools can have "2024-2025" academic year - they are completely isolated by school_id.

### 2. Multi-Year Records
Student transfers between schools require:
- Creating new student record in destination school
- Marking old record as transferred/inactive
- No shared records between schools

### 3. Concurrent Access
Database triggers ensure atomicity - even with concurrent operations, violations are prevented.

### 4. Bulk Operations
Use the query builder's array insert:
```typescript
await studentQuery.insert([
  { student_name: 'Student 1', lrn: '111' },
  { student_name: 'Student 2', lrn: '222' },
  // school_id and academic_year_id added to all
]);
```

## Migration Guide

### Applying the Migration

1. **Backup Database**
   ```bash
   # Create backup before applying
   ```

2. **Run Migration**
   ```sql
   -- File: supabase/migrations/20260205040000_school_year_segregation.sql
   ```

3. **Verify Migration**
   ```sql
   -- File: supabase/migrations/verify_segregation.sql
   ```

4. **Fix Any Violations**
   If verification finds violations, audit and fix them before proceeding.

### Updating Existing Code

Replace direct Supabase queries:
```typescript
// ❌ OLD - No automatic filtering
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('school_id', schoolId)
  .eq('academic_year_id', academicYearId);

// ✅ NEW - Automatic filtering
const studentQuery = useSchoolYearQuery('students');
const { data } = await studentQuery.select('*');
```

## Troubleshooting

### Error: "School context is required but not set"
**Cause:** Attempting database operation without school context
**Solution:** Ensure `SchoolContext` is properly initialized and school is selected

### Error: "Data segregation violation"
**Cause:** Attempting to insert/update with mismatched school-academic year
**Solution:** Verify academic year belongs to the correct school

### Performance Issues
**Cause:** Queries not using composite indexes
**Solution:** Run EXPLAIN ANALYZE and verify index usage

## Security Considerations

1. **Database Triggers** - Cannot be bypassed by application code
2. **Composite Indexes** - Ensure efficient filtering
3. **Type Safety** - TypeScript prevents many common errors
4. **Context Validation** - Runtime checks for missing context

## Future Enhancements

- [ ] Row Level Security (RLS) policies for additional protection
- [ ] Automated testing suite for segregation
- [ ] Monitoring/alerting for violation attempts
- [ ] Admin audit log for cross-school operations

## Support

For issues or questions about data segregation:
1. Check verification script results
2. Review error messages from triggers
3. Consult this documentation
4. Check application logs for SchoolContextError
