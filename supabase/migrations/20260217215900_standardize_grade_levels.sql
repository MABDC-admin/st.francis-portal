-- Migration to standardize grade level naming
-- Target Format: "Kindergarten", "Grade 1", "Grade 2", ..., "Grade 12"

DO $$ 
BEGIN

-- 1. Update students table (column: level)
UPDATE public.students SET level = 'Kindergarten' WHERE level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.students SET level = 'Grade ' || i WHERE level = 'Level ' || i;
END LOOP;

-- 2. Update subjects table (column: grade_levels - ARRAY)
-- We need to replace elements in the array and then ensure they are unique
UPDATE public.subjects 
SET grade_levels = ARRAY(
    SELECT DISTINCT CASE 
        WHEN x IN ('Kinder 1', 'Kinder 2') THEN 'Kindergarten'
        WHEN x LIKE 'Level %' THEN 'Grade ' || split_part(x, ' ', 2)
        ELSE x 
    END
    FROM unnest(grade_levels) AS x
);

-- 3. Update teacher_applications (column: preferred_level)
UPDATE public.teacher_applications SET preferred_level = 'Kindergarten' WHERE preferred_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.teacher_applications SET preferred_level = 'Grade ' || i WHERE preferred_level = 'Level ' || i;
END LOOP;

-- 4. Update online_registrations (column: level)
UPDATE public.online_registrations SET level = 'Kindergarten' WHERE level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.online_registrations SET level = 'Grade ' || i WHERE level = 'Level ' || i;
END LOOP;

-- 5. Update admissions (column: level)
UPDATE public.admissions SET level = 'Kindergarten' WHERE level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.admissions SET level = 'Grade ' || i WHERE level = 'Level ' || i;
END LOOP;

-- 6. Update fee_templates (column: grade_level)
UPDATE public.fee_templates SET grade_level = 'Kindergarten' WHERE grade_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.fee_templates SET grade_level = 'Grade ' || i WHERE grade_level = 'Level ' || i;
END LOOP;

-- 7. Update class_schedules (column: grade_level)
UPDATE public.class_schedules SET grade_level = 'Kindergarten' WHERE grade_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.class_schedules SET grade_level = 'Grade ' || i WHERE grade_level = 'Level ' || i;
END LOOP;

-- 8. Update student_assignments (column: grade_level)
UPDATE public.student_assignments SET grade_level = 'Kindergarten' WHERE grade_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.student_assignments SET grade_level = 'Grade ' || i WHERE grade_level = 'Level ' || i;
END LOOP;

-- 9. Update exam_schedules (column: grade_level)
UPDATE public.exam_schedules SET grade_level = 'Kindergarten' WHERE grade_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.exam_schedules SET grade_level = 'Grade ' || i WHERE grade_level = 'Level ' || i;
END LOOP;

-- 10. Update announcements (column: target_grade_levels - ARRAY)
UPDATE public.announcements 
SET target_grade_levels = ARRAY(
    SELECT DISTINCT CASE 
        WHEN x IN ('Kinder 1', 'Kinder 2') THEN 'Kindergarten'
        WHEN x LIKE 'Level %' THEN 'Grade ' || split_part(x, ' ', 2)
        ELSE x 
    END
    FROM unnest(target_grade_levels) AS x
)
WHERE target_grade_levels IS NOT NULL;

-- 11. Update school_visits (column: visitor_level)
UPDATE public.school_visits SET visitor_level = 'Kindergarten' WHERE visitor_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.school_visits SET visitor_level = 'Grade ' || i WHERE visitor_level = 'Level ' || i;
END LOOP;
-- 12. Update books table (column: grade_level - INTEGER to TEXT)
-- First add a temporary column
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS temp_grade_level TEXT;

UPDATE public.books 
SET temp_grade_level = CASE 
    WHEN grade_level = 0 THEN 'Kindergarten'
    ELSE 'Grade ' || grade_level 
END;

-- Swap columns
ALTER TABLE public.books DROP COLUMN grade_level;
ALTER TABLE public.books RENAME COLUMN temp_grade_level TO grade_level;
ALTER TABLE public.books ALTER COLUMN grade_level SET NOT NULL;

-- 13. Update teachers table (column: grade_level)
UPDATE public.teachers SET grade_level = 'Kindergarten' WHERE grade_level IN ('Kinder 1', 'Kinder 2');
FOR i IN 1..12 LOOP
    UPDATE public.teachers SET grade_level = 'Grade ' || i WHERE grade_level = 'Level ' || i;
END LOOP;

END $$;
