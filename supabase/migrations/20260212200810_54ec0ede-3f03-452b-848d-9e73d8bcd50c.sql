
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS religion text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS current_address text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS signature_data text;
ALTER TABLE online_registrations ADD COLUMN IF NOT EXISTS agreements_accepted jsonb DEFAULT '{}';
