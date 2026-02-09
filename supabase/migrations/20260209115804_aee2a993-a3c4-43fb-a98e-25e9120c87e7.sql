
ALTER TABLE student_grades
  DROP CONSTRAINT student_grades_academic_year_id_fkey;

ALTER TABLE student_grades
  ADD CONSTRAINT student_grades_academic_year_id_fkey
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;
