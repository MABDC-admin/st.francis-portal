
ALTER TABLE public.school_visits
  DROP CONSTRAINT school_visits_registration_id_fkey;

ALTER TABLE public.school_visits
  ADD CONSTRAINT school_visits_registration_id_fkey
  FOREIGN KEY (registration_id) REFERENCES public.online_registrations(id) ON DELETE CASCADE;
