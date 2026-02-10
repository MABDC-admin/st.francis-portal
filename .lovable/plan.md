

# Clean Up: Consolidate Migrations and Seed SFXSAI Data

## Summary

The application source code is fully clean (zero MABDC/STFXSA references). The database is also clean with no students or users. Two remaining tasks:

1. **Consolidate migration files** -- 7 old migration files contain MABDC references. These are historical SQL and don't affect runtime, but should be cleaned for maintainability.
2. **Seed school_settings** -- The auth page queries `school_settings` for SFXSAI but the table is empty, causing 406 errors on the login page.

## Changes

### 1. Database: Seed school_settings for SFXSAI

Run a migration to insert the SFXSAI school settings record so the login page works properly:

```sql
INSERT INTO school_settings (school_id, name, acronym, address)
VALUES ('SFXSAI', 'St. Francis Xavier Smart Academy Inc', 'SFXSAI', 'Capas, Tarlac, Philippines')
ON CONFLICT (school_id) DO NOTHING;
```

Also clean up any leftover MABDC data from events or other tables:

```sql
DELETE FROM school_events WHERE school = 'MABDC';
DELETE FROM school_settings WHERE school_id = 'MABDC';
```

### 2. Consolidate Migration Files

Replace the 7 old migration files that contain MABDC references with cleaned versions that only reference SFXSAI:

- `supabase/migrations/20251217193051_*.sql` -- Change default from `'MABDC'` to `'SFXSAI'`
- `supabase/migrations/20251217213013_*.sql` -- Remove MABDC seed row, rename STFXSA to SFXSAI
- `supabase/migrations/20251217222414_*.sql` -- Change default from `'MABDC'` to `'SFXSAI'`
- `supabase/migrations/20251217232509_*.sql` -- Change default from `'MABDC'` to `'SFXSAI'`
- `supabase/migrations/20260205000000_seed_holidays.sql` -- Remove MABDC holidays section, rename STFXSA to SFXSAI
- `supabase/migrations/20260207183455_*.sql` -- Remove MABDC school insert
- `supabase/migrations/20260210151404_*.sql` -- Remove MABDC update lines (already done)

### 3. Verify No Remaining References

After changes, a search across the entire project for "MABDC" and "STFXSA" should return zero results.

## Technical Details

### Migration file edits (7 files)

Each file will have its MABDC defaults and seed data replaced with SFXSAI equivalents. The migration history is preserved (same filenames) but the content is cleaned to reflect the single-school architecture.

### What is already clean
- All source code in `src/` -- zero MABDC/STFXSA references
- `supabase/functions/` -- already updated
- Database tables: students, teachers, profiles, auth.users -- all empty
- Schools table -- only SFXSAI exists

