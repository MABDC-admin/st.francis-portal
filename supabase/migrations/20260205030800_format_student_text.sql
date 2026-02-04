-- Migration: Format student text fields with proper capitalization
-- This trigger automatically capitalizes student names and other text fields

-- Create the title case function
CREATE OR REPLACE FUNCTION title_case(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    word TEXT;
    words TEXT[];
BEGIN
    IF input_text IS NULL OR input_text = '' THEN
        RETURN input_text;
    END IF;
    
    -- Split into words
    words := string_to_array(lower(input_text), ' ');
    
    FOREACH word IN ARRAY words
    LOOP
        -- Handle common suffixes that need special casing
        IF word IN ('jr', 'jr.', 'sr', 'sr.') THEN
            result := result || initcap(word) || ' ';
        ELSIF word IN ('ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x') THEN
            result := result || upper(word) || ' ';
        ELSE
            result := result || initcap(word) || ' ';
        END IF;
    END LOOP;
    
    -- Trim trailing space
    RETURN rtrim(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create the trigger function for students table
CREATE OR REPLACE FUNCTION format_student_text_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- Format student name
    IF NEW.student_name IS NOT NULL THEN
        NEW.student_name := title_case(NEW.student_name);
    END IF;
    
    -- Format Philippine address if exists
    IF NEW.phil_address IS NOT NULL THEN
        NEW.phil_address := title_case(NEW.phil_address);
    END IF;
    
    -- Format UAE address if exists
    IF NEW.uae_address IS NOT NULL THEN
        NEW.uae_address := title_case(NEW.uae_address);
    END IF;
    
    -- Format mother's maiden name if exists
    IF NEW.mother_maiden_name IS NOT NULL THEN
        NEW.mother_maiden_name := title_case(NEW.mother_maiden_name);
    END IF;
    
    -- Format father's name if exists
    IF NEW.father_name IS NOT NULL THEN
        NEW.father_name := title_case(NEW.father_name);
    END IF;
    
    -- Format previous school if exists
    IF NEW.previous_school IS NOT NULL THEN
        NEW.previous_school := title_case(NEW.previous_school);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS format_student_text_on_insert_update ON students;

-- Create the trigger
CREATE TRIGGER format_student_text_on_insert_update
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION format_student_text_fields();

-- Update all existing records to have proper capitalization
UPDATE students SET 
    student_name = title_case(student_name),
    phil_address = title_case(phil_address),
    uae_address = title_case(uae_address),
    mother_maiden_name = title_case(mother_maiden_name),
    father_name = title_case(father_name),
    previous_school = title_case(previous_school)
WHERE student_name IS NOT NULL;

-- Add comment for documentation
COMMENT ON FUNCTION title_case(TEXT) IS 'Converts text to Title Case with special handling for name suffixes';
COMMENT ON FUNCTION format_student_text_fields() IS 'Trigger function to automatically format student text fields with proper capitalization';
