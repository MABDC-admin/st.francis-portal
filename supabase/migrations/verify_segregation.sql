-- ============================================================================
-- School-Academic Year Data Segregation Verification Script
-- ============================================================================
-- Run this script to verify that data segregation is working correctly
-- and that no cross-contamination exists between schools

-- ============================================================================
-- PART 1: Audit Existing Data for Inconsistencies
-- ============================================================================

-- Check for students with mismatched school-academic year
SELECT 
  'students' as table_name,
  s.id,
  s.student_name,
  s.school_id,
  sch.name as school_name,
  s.academic_year_id,
  ay.school_id as ay_school_id,
  ay.year_name
FROM students s
JOIN schools sch ON s.school_id = sch.id
JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE s.school_id != ay.school_id;

-- Check for grades with mismatched school-academic year
SELECT 
  'grades' as table_name,
  g.id,
  g.school_id,
  g.academic_year_id,
  ay.school_id as ay_school_id
FROM grades g
JOIN academic_years ay ON g.academic_year_id = ay.id
WHERE g.school_id != ay.school_id;

-- Check for attendance with mismatched school-academic year
SELECT 
  'attendance' as table_name,
  a.id,
  a.school_id,
  a.academic_year_id,
  ay.school_id as ay_school_id
FROM attendance a
JOIN academic_years ay ON a.academic_year_id = ay.id
WHERE a.school_id != ay.school_id;

-- Check for raw_scores with mismatched school-academic year
SELECT 
  'raw_scores' as table_name,
  rs.id,
  rs.school_id,
  rs.academic_year_id,
  ay.school_id as ay_school_id
FROM raw_scores rs
JOIN academic_years ay ON rs.academic_year_id = ay.id
WHERE rs.school_id != ay.school_id;

-- ============================================================================
-- PART 2: Verify Indexes Exist
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE indexname IN (
  'idx_students_school_year',
  'idx_grades_school_year',
  'idx_attendance_school_year',
  'idx_raw_scores_school_year',
  'idx_enrollments_school_year'
)
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 3: Verify Triggers Exist
-- ============================================================================

SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_validate_%_school_year'
ORDER BY event_object_table;

-- ============================================================================
-- PART 4: Test Data Segregation (Safe Read-Only Tests)
-- ============================================================================

-- Count students by school and academic year
SELECT 
  sch.name as school_name,
  ay.year_name,
  COUNT(s.id) as student_count
FROM schools sch
CROSS JOIN academic_years ay
LEFT JOIN students s ON s.school_id = sch.id AND s.academic_year_id = ay.id
WHERE ay.school_id = sch.id
GROUP BY sch.id, sch.name, ay.id, ay.year_name
ORDER BY sch.name, ay.year_name;

-- Verify no students exist with cross-school academic years
SELECT 
  COUNT(*) as violation_count,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASS: No cross-school violations found'
    ELSE 'FAIL: Cross-school violations detected'
  END as status
FROM students s
JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE s.school_id != ay.school_id;

-- ============================================================================
-- PART 5: Performance Check
-- ============================================================================

-- Explain query plan for student lookup (should use composite index)
EXPLAIN ANALYZE
SELECT * FROM students
WHERE school_id = (SELECT id FROM schools LIMIT 1)
  AND academic_year_id = (SELECT id FROM academic_years LIMIT 1);

-- ============================================================================
-- PART 6: Summary Report
-- ============================================================================

SELECT 
  'Data Segregation Verification Summary' as report_title,
  (SELECT COUNT(*) FROM students s 
   JOIN academic_years ay ON s.academic_year_id = ay.id 
   WHERE s.school_id != ay.school_id) as student_violations,
  (SELECT COUNT(*) FROM grades g 
   JOIN academic_years ay ON g.academic_year_id = ay.id 
   WHERE g.school_id != ay.school_id) as grade_violations,
  (SELECT COUNT(*) FROM attendance a 
   JOIN academic_years ay ON a.academic_year_id = ay.id 
   WHERE a.school_id != ay.school_id) as attendance_violations,
  (SELECT COUNT(*) FROM raw_scores rs 
   JOIN academic_years ay ON rs.academic_year_id = ay.id 
   WHERE rs.school_id != ay.school_id) as raw_score_violations,
  (SELECT COUNT(*) FROM pg_indexes 
   WHERE indexname LIKE 'idx_%_school_year') as index_count,
  (SELECT COUNT(*) FROM information_schema.triggers 
   WHERE trigger_name LIKE 'trg_validate_%_school_year') as trigger_count;

-- ============================================================================
-- EXPECTED RESULTS:
-- - All violation counts should be 0
-- - Index count should be 5 (students, grades, attendance, raw_scores, enrollments)
-- - Trigger count should be 5 (same tables)
-- - Query plans should show index usage
-- ============================================================================
