
-- Upsert the school record with the new code
UPDATE schools SET code = 'SFXSAI', name = 'St. Francis Xavier Smart Academy Inc' WHERE code = 'STFXSA';
INSERT INTO schools (id, name, code)
VALUES ('22222222-2222-2222-2222-222222222222', 'St. Francis Xavier Smart Academy Inc', 'SFXSAI')
ON CONFLICT (id) DO UPDATE SET code = 'SFXSAI', name = 'St. Francis Xavier Smart Academy Inc';

-- Update all students referencing old codes
UPDATE students SET school = 'SFXSAI' WHERE school = 'STFXSA';
UPDATE students SET school = 'SFXSAI' WHERE school = 'MABDC';
