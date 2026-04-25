-- Add extended learner profile fields for full Student Profile CRUD support
ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS parent_occupation text,
  ADD COLUMN IF NOT EXISTS parent_education_attainment text,
  ADD COLUMN IF NOT EXISTS household_information text,
  ADD COLUMN IF NOT EXISTS achievements text,
  ADD COLUMN IF NOT EXISTS medical_history text,
  ADD COLUMN IF NOT EXISTS immunization_record text,
  ADD COLUMN IF NOT EXISTS disabilities_special_needs text,
  ADD COLUMN IF NOT EXISTS learning_style text,
  ADD COLUMN IF NOT EXISTS strengths_interests text,
  ADD COLUMN IF NOT EXISTS program_inclusion text,
  ADD COLUMN IF NOT EXISTS interventions_provided text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_number text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relationship text;
