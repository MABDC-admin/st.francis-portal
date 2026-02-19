# School Segregation Enhancements - Usage Guide

## Overview

This document covers the advanced features added to the school segregation system, including RLS policies, audit logging, user-school access management, and data export tracking.

## New Features

### 1. User-School Access Management

Track which users have access to which schools and their roles.

#### Database Table: `user_school_access`

```sql
CREATE TABLE user_school_access (
  user_id UUID,
  school_id UUID,
  role TEXT, -- 'admin', 'registrar', 'teacher', 'viewer'
  granted_by UUID,
  granted_at TIMESTAMP,
  is_active BOOLEAN
);
```

#### TypeScript Usage

```typescript
import { 
  getUserSchools, 
  grantSchoolAccess, 
  revokeSchoolAccess,
  checkSchoolAccess 
} from '@/utils/schoolAccessUtils';

// Get all schools user can access
const schools = await getUserSchools();
// Returns: [{ school_id, school_name, school_code, user_role }]

// Check if user has access to a specific school
const hasAccess = await checkSchoolAccess(schoolId);

// Grant access (admin only)
await grantSchoolAccess(userId, schoolId, 'registrar');

// Revoke access (admin only)
await revokeSchoolAccess(userId, schoolId);
```

### 2. Audit Logging

Automatically track all data access and modifications.

#### Database Table: `school_access_logs`

```sql
CREATE TABLE school_access_logs (
  user_id UUID,
  school_id UUID,
  academic_year_id UUID,
  action TEXT, -- 'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'EXPORT'
  table_name TEXT,
  record_id UUID,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP
);
```

#### TypeScript Usage

```typescript
import { logSchoolAccess, getSchoolAccessLogs } from '@/utils/schoolAccessUtils';

// Manual logging
await logSchoolAccess({
  schoolId: 'school-uuid',
  academicYearId: 'year-uuid',
  action: 'SELECT',
  tableName: 'students',
  recordId: 'student-uuid',
  success: true,
});

// Get access logs for a school
const logs = await getSchoolAccessLogs(schoolId, 100);
```

#### Automatic Logging

Use `AuditedSchoolYearQueryBuilder` for automatic logging:

```typescript
import { AuditedSchoolYearQueryBuilder } from '@/utils/schoolAccessUtils';

const query = new AuditedSchoolYearQueryBuilder('students', schoolId, academicYearId);

// All operations are automatically logged
const { data } = await query.select('*');
await query.insert({ student_name: 'John Doe' });
await query.update({ level: 'Grade 2' });
await query.delete();
```

### 3. School Switching History

Track when users switch between schools and academic years.

#### Database Table: `school_switch_log`

```sql
CREATE TABLE school_switch_log (
  user_id UUID,
  from_school_id UUID,
  to_school_id UUID,
  from_academic_year_id UUID,
  to_academic_year_id UUID,
  session_id TEXT,
  switched_at TIMESTAMP
);
```

#### TypeScript Usage

```typescript
import { logSchoolSwitch, getSchoolSwitchHistory } from '@/utils/schoolAccessUtils';

// Log a school switch
await logSchoolSwitch({
  fromSchoolId: 'old-school-uuid',
  toSchoolId: 'new-school-uuid',
  fromAcademicYearId: 'old-year-uuid',
  toAcademicYearId: 'new-year-uuid',
  sessionId: sessionStorage.getItem('session-id'),
});

// Get switch history
const history = await getSchoolSwitchHistory(50);
```

### 4. Data Export Tracking

Monitor all data exports with school context.

#### Database Table: `data_exports`

```sql
CREATE TABLE data_exports (
  user_id UUID,
  school_id UUID,
  academic_year_id UUID,
  export_type TEXT, -- 'PDF', 'XLSX', 'CSV'
  table_name TEXT,
  record_count INTEGER,
  file_name TEXT,
  file_size_bytes BIGINT,
  exported_at TIMESTAMP
);
```

#### TypeScript Usage

```typescript
import { 
  logDataExport, 
  getExportHistory, 
  getSchoolExportStats 
} from '@/utils/schoolAccessUtils';

// Log an export
await logDataExport({
  schoolId: 'school-uuid',
  academicYearId: 'year-uuid',
  exportType: 'PDF',
  tableName: 'students',
  recordCount: 100,
  fileName: 'students_2024.pdf',
  fileSizeBytes: 1024000,
});

// Get export history
const exports = await getExportHistory(50);

// Get export statistics
const stats = await getSchoolExportStats(schoolId);
// Returns: { totalExports, exportsByType, exportsByTable }
```

### 5. Row Level Security (RLS) Policies

Automatic database-level filtering ensures users only see their school's data.

#### How It Works

```sql
-- Example: Students table policy
CREATE POLICY "Users can view students from their schools" 
ON students
FOR SELECT USING (
  school_id IN (
    SELECT school_id FROM user_school_access 
    WHERE user_id = auth.uid() AND is_active = true
  )
  OR has_role(auth.uid(), 'admin')
);
```

**Benefits:**
- ✅ Cannot be bypassed by application code
- ✅ Works even with direct SQL queries
- ✅ Automatic filtering - no manual WHERE clauses needed
- ✅ Admins can see all schools

### 6. Helper Functions

#### Check User Access

```sql
SELECT user_has_school_access('user-uuid', 'school-uuid');
-- Returns: true/false
```

```typescript
const hasAccess = await checkSchoolAccess(schoolId);
```

#### Get User Schools

```sql
SELECT * FROM get_user_schools('user-uuid');
-- Returns: school_id, school_name, school_code, user_role
```

```typescript
const schools = await getUserSchools();
```

#### Log Access

```sql
SELECT log_school_access(
  'user-uuid',
  'school-uuid',
  'year-uuid',
  'SELECT',
  'students',
  'record-uuid',
  true,
  null
);
```

```typescript
await logSchoolAccess({ ... });
```

## Integration Examples

### Example 1: School Switcher Component

```typescript
import { logSchoolSwitch } from '@/utils/schoolAccessUtils';

function SchoolSwitcher() {
  const { selectedSchool, setSelectedSchool } = useSchool();
  
  const handleSchoolChange = async (newSchool: string) => {
    const oldSchoolId = SCHOOL_DB_IDS[selectedSchool];
    const newSchoolId = SCHOOL_DB_IDS[newSchool];
    
    // Log the switch
    await logSchoolSwitch({
      fromSchoolId: oldSchoolId,
      toSchoolId: newSchoolId,
    });
    
    // Update context
    setSelectedSchool(newSchool);
  };
  
  return (
    <select onChange={(e) => handleSchoolChange(e.target.value)}>
      <option value="STFXS">STFXS</option>
      <option value="STFXSA">STFXSA</option>
    </select>
  );
}
```

### Example 2: Export with Logging

```typescript
import { logDataExport } from '@/utils/schoolAccessUtils';

async function exportStudentsPDF(students: Student[], schoolId: string, yearId: string) {
  // Generate PDF
  const pdf = generatePDF(students);
  const fileName = `students_${Date.now()}.pdf`;
  const fileSize = pdf.output('arraybuffer').byteLength;
  
  // Log the export
  await logDataExport({
    schoolId,
    academicYearId: yearId,
    exportType: 'PDF',
    tableName: 'students',
    recordCount: students.length,
    fileName,
    fileSizeBytes: fileSize,
  });
  
  // Download
  pdf.save(fileName);
}
```

### Example 3: Admin Dashboard - Access Logs

```typescript
import { getSchoolAccessLogs } from '@/utils/schoolAccessUtils';

function AccessLogsPage() {
  const [logs, setLogs] = useState([]);
  
  useEffect(() => {
    async function loadLogs() {
      const data = await getSchoolAccessLogs(schoolId, 100);
      setLogs(data);
    }
    loadLogs();
  }, [schoolId]);
  
  return (
    <table>
      <thead>
        <tr>
          <th>User</th>
          <th>Action</th>
          <th>Table</th>
          <th>Time</th>
          <th>Success</th>
        </tr>
      </thead>
      <tbody>
        {logs.map(log => (
          <tr key={log.id}>
            <td>{log.user_id}</td>
            <td>{log.action}</td>
            <td>{log.table_name}</td>
            <td>{new Date(log.created_at).toLocaleString()}</td>
            <td>{log.success ? '✅' : '❌'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Performance Monitoring

### Access Statistics View

```sql
SELECT * FROM school_access_stats
WHERE school_name = 'STFXS'
ORDER BY access_date DESC;
```

Returns:
- School name
- Action type (SELECT, INSERT, etc.)
- Table name
- Access count
- Unique users
- Date

### Export Statistics

```typescript
const stats = await getSchoolExportStats(schoolId);

console.log(`Total exports: ${stats.totalExports}`);
console.log('By type:', stats.exportsByType);
// { PDF: 50, XLSX: 30, CSV: 20 }
console.log('By table:', stats.exportsByTable);
// { students: 60, grades: 40 }
```

## Security Best Practices

### 1. Always Use RLS Policies
- RLS policies are enforced at the database level
- Cannot be bypassed by application code
- Provide defense in depth

### 2. Log All Sensitive Operations
```typescript
// Before deleting
await logSchoolAccess({
  schoolId,
  academicYearId,
  action: 'DELETE',
  tableName: 'students',
  recordId: studentId,
});

// Then delete
await deleteStudent(studentId);
```

### 3. Verify Access Before Operations
```typescript
const hasAccess = await checkSchoolAccess(schoolId);
if (!hasAccess) {
  throw new Error('Access denied');
}
```

### 4. Monitor Export Activity
```typescript
// Alert if unusual export activity
const stats = await getSchoolExportStats(schoolId);
if (stats.totalExports > 100) {
  sendAlert('High export activity detected');
}
```

## Troubleshooting

### Issue: RLS blocking legitimate access

**Solution:** Grant user access to the school
```typescript
await grantSchoolAccess(userId, schoolId, 'registrar');
```

### Issue: Logs not appearing

**Solution:** Check RLS policies allow log insertion
```sql
-- Policy should allow anyone to insert logs
CREATE POLICY "System can insert access logs" 
ON school_access_logs
FOR INSERT WITH CHECK (true);
```

### Issue: Performance degradation

**Solution:** Ensure indexes are created
```sql
-- Check indexes
SELECT * FROM pg_indexes 
WHERE tablename IN ('school_access_logs', 'user_school_access');
```

## Migration Order

1. Run base segregation migration first
2. Then run enhancements migration
3. Grant users access to schools
4. Update application code to use new utilities

## Next Steps

- [ ] Run enhancement migration in Supabase
- [ ] Grant school access to existing users
- [ ] Integrate logging into export functions
- [ ] Add access logs dashboard for admins
- [ ] Monitor performance and adjust indexes as needed
