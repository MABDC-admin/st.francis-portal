-- =====================================================
-- DepEd Grade Level & Academic Year Verification Script
-- =====================================================

-- 1. Check students table structure (verify strand column exists)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'students'
    AND column_name IN ('level', 'strand', 'academic_year_id', 'school_id')
ORDER BY ordinal_position;

-- 2. Check current grade level distribution
SELECT 
    level,
    strand,
    COUNT(*) as student_count
FROM students
GROUP BY level, strand
ORDER BY 
    CASE 
        WHEN level LIKE 'Kinder%' OR level = 'Kindergarten' THEN 1
        WHEN level LIKE 'Grade%' OR level LIKE 'Level%' THEN 2
        ELSE 3
    END,
    level,
    strand;

-- 3. Verify academic year linkage
SELECT 
    ay.name as academic_year,
    ay.is_current,
    s.level,
    s.strand,
    COUNT(s.id) as student_count
FROM academic_years ay
LEFT JOIN students s ON s.academic_year_id = ay.id
WHERE s.school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1)
GROUP BY ay.id, ay.name, ay.is_current, s.level, s.strand
ORDER BY ay.name DESC, s.level;

-- 4. Find students with Grade 11/12 but missing strand
SELECT 
    s.id,
    s.student_name,
    s.lrn,
    s.level,
    s.strand,
    ay.name as academic_year
FROM students s
LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
WHERE (s.level = 'Grade 11' OR s.level = 'Grade 12' OR s.level = 'Level 11' OR s.level = 'Level 12')
    AND (s.strand IS NULL OR s.strand = '')
    AND s.school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1)
ORDER BY s.level, s.student_name;

-- 5. Check academic years configuration
SELECT 
    id,
    name,
    start_date,
    end_date,
    is_current,
    school_id
FROM academic_years
WHERE school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1)
ORDER BY start_date DESC;

-- 6. Verify students are properly linked to academic years
SELECT 
    COUNT(*) as total_students,
    COUNT(academic_year_id) as students_with_academic_year,
    COUNT(*) - COUNT(academic_year_id) as students_without_academic_year
FROM students
WHERE school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1);

-- 7. Check for legacy grade level formats that need migration
SELECT 
    level,
    COUNT(*) as count,
    CASE 
        WHEN level = 'Kinder 1' THEN 'Should migrate to: Kindergarten'
        WHEN level = 'Kinder 2' THEN 'Should migrate to: Kindergarten'
        WHEN level LIKE 'Level %' THEN CONCAT('Should migrate to: Grade ', SUBSTRING(level FROM 7))
        ELSE 'Already DepEd compliant'
    END as recommendation
FROM students
WHERE school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1)
GROUP BY level
ORDER BY level;

-- 8. Check admissions table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'admissions'
    AND column_name IN ('level', 'strand', 'academic_year_id', 'school_id')
ORDER BY ordinal_position;

-- 9. Verify SHS strand distribution
SELECT 
    strand,
    level,
    COUNT(*) as student_count
FROM students
WHERE (level LIKE '%11%' OR level LIKE '%12%')
    AND strand IS NOT NULL 
    AND strand != ''
    AND school_id = (SELECT id FROM schools WHERE code = 'STFXSA' LIMIT 1)
GROUP BY strand, level
ORDER BY strand, level;

-- 10. Check schools table
SELECT 
    id,
    code,
    name,
    created_at
FROM schools
WHERE code = 'STFXSA';
