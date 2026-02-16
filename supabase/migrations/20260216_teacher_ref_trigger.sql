-- Create a sequence for teacher application numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS teacher_application_seq;

-- Function to generate the reference number
CREATE OR REPLACE FUNCTION generate_teacher_ref_number()
RETURNS TRIGGER AS $$
DECLARE
    year_prefix TEXT;
    seq_num INT;
BEGIN
    -- Get the current year (e.g., "2026")
    year_prefix := to_char(CURRENT_DATE, 'YYYY');
    
    -- Get the next value from the sequence
    seq_num := nextval('teacher_application_seq');
    
    -- Format: TCH-YYYY-XXXX (e.g., TCH-2026-0001)
    -- LPAD ensures 4 digits with leading zeros
    NEW.reference_number := 'TCH-' || year_prefix || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run before insert on teacher_applications
DROP TRIGGER IF EXISTS trg_generate_teacher_ref_number ON teacher_applications;

CREATE TRIGGER trg_generate_teacher_ref_number
BEFORE INSERT ON teacher_applications
FOR EACH ROW
WHEN (NEW.reference_number IS NULL OR NEW.reference_number = '')
EXECUTE FUNCTION generate_teacher_ref_number();
