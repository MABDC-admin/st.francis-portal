
-- Step 1: Delete all existing subjects that overlap with affected grade levels
DELETE FROM public.subjects
WHERE grade_levels && ARRAY[
  'Kinder 1', 'Kinder 2', 'Kindergarten',
  'Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5', 'Level 6', 'Level 7',
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'
];

-- Step 2: Insert DepEd-aligned subjects with dual naming conventions

-- === KINDER ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('K-LLC', 'Literacy, Language, and Communication', ARRAY['Kinder 2', 'Kindergarten'], true, 1),
  ('K-SED', 'Socio-Emotional Development', ARRAY['Kinder 2', 'Kindergarten'], true, 1),
  ('K-VD', 'Values Development', ARRAY['Kinder 2', 'Kindergarten'], true, 1),
  ('K-PHMD', 'Physical Health and Motor Development', ARRAY['Kinder 2', 'Kindergarten'], true, 1),
  ('K-ACD', 'Aesthetic/Creative Development', ARRAY['Kinder 2', 'Kindergarten'], true, 1),
  ('K-CD', 'Cognitive Development', ARRAY['Kinder 2', 'Kindergarten'], true, 1);

-- === GRADE/LEVEL 1 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G1-MATH', 'Math', ARRAY['Level 1', 'Grade 1'], true, 1),
  ('G1-GMRC', 'GMRC', ARRAY['Level 1', 'Grade 1'], true, 1),
  ('G1-LANG', 'Language', ARRAY['Level 1', 'Grade 1'], true, 1),
  ('G1-RL', 'Reading and Literacy', ARRAY['Level 1', 'Grade 1'], true, 1),
  ('G1-MAKA', 'Makabansa', ARRAY['Level 1', 'Grade 1'], true, 1);

-- === GRADE/LEVEL 2 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G2-FIL', 'Filipino', ARRAY['Level 2', 'Grade 2'], true, 1),
  ('G2-ENG', 'English', ARRAY['Level 2', 'Grade 2'], true, 1),
  ('G2-MATH', 'Math', ARRAY['Level 2', 'Grade 2'], true, 1),
  ('G2-MAKA', 'Makabansa', ARRAY['Level 2', 'Grade 2'], true, 1),
  ('G2-GMRC', 'GMRC', ARRAY['Level 2', 'Grade 2'], true, 1);

-- === GRADE/LEVEL 3 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G3-FIL', 'Filipino', ARRAY['Level 3', 'Grade 3'], true, 1),
  ('G3-ENG', 'English', ARRAY['Level 3', 'Grade 3'], true, 1),
  ('G3-MATH', 'Math', ARRAY['Level 3', 'Grade 3'], true, 1),
  ('G3-SCI', 'Science', ARRAY['Level 3', 'Grade 3'], true, 1),
  ('G3-MAKA', 'Makabansa', ARRAY['Level 3', 'Grade 3'], true, 1),
  ('G3-GMRC', 'GMRC', ARRAY['Level 3', 'Grade 3'], true, 1);

-- === GRADE/LEVEL 4-5 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G45-FIL', 'Filipino', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-ENG', 'English', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-MATH', 'Math', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-SCI', 'Science', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-EPP', 'EPP', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-AP', 'AP', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-MAPEH', 'MAPEH', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1),
  ('G45-GMRC', 'GMRC', ARRAY['Level 4', 'Level 5', 'Grade 4', 'Grade 5'], true, 1);

-- === GRADE/LEVEL 6 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G6-FIL', 'Filipino', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-ENG', 'English', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-MATH', 'Math', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-SCI', 'Science', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-AP', 'AP', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-TLE', 'TLE', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-ESP', 'ESP', ARRAY['Level 6', 'Grade 6'], true, 1),
  ('G6-MAPEH', 'MAPEH', ARRAY['Level 6', 'Grade 6'], true, 1);

-- === GRADE/LEVEL 7 ===
INSERT INTO public.subjects (code, name, grade_levels, is_active, units) VALUES
  ('G7-FIL', 'Filipino', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-ENG', 'English', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-MATH', 'Math', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-SCI', 'Science', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-AP', 'AP', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-TLE', 'TLE', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-ESP', 'ESP', ARRAY['Level 7', 'Grade 7'], true, 1),
  ('G7-MAPEH', 'MAPEH', ARRAY['Level 7', 'Grade 7'], true, 1);
