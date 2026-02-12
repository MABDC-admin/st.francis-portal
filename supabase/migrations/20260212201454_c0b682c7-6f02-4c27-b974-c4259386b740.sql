
-- Create school_info table
CREATE TABLE public.school_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) NOT NULL,
  registrar_name text,
  registrar_photo_url text,
  registrar_phone text,
  registrar_email text,
  office_hours text,
  latitude numeric,
  longitude numeric,
  map_embed_url text,
  facility_photos jsonb DEFAULT '[]',
  visit_slots_config jsonb DEFAULT '{"morning": "9:00 AM - 12:00 PM", "afternoon": "1:00 PM - 4:00 PM", "max_per_slot": 5}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_info ENABLE ROW LEVEL SECURITY;

-- Public can view school info
CREATE POLICY "Anyone can view school info" ON public.school_info FOR SELECT USING (true);

-- Admin can insert/update
CREATE POLICY "Admins can insert school info" ON public.school_info FOR INSERT
  WITH CHECK (public.user_has_school_access(auth.uid(), school_id));

CREATE POLICY "Admins can update school info" ON public.school_info FOR UPDATE
  USING (public.user_has_school_access(auth.uid(), school_id));

-- Create school_visits table
CREATE TABLE public.school_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) NOT NULL,
  registration_id uuid REFERENCES public.online_registrations(id),
  visitor_name text NOT NULL,
  visitor_email text,
  visitor_phone text,
  visit_date date NOT NULL,
  visit_slot text NOT NULL,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.school_visits ENABLE ROW LEVEL SECURITY;

-- Anyone can schedule a visit (public form)
CREATE POLICY "Anyone can schedule a visit" ON public.school_visits FOR INSERT WITH CHECK (true);

-- Anyone can view visit counts (for capacity checking)
CREATE POLICY "Anyone can view visits" ON public.school_visits FOR SELECT USING (true);

-- Admin can update visits
CREATE POLICY "Admins can update visits" ON public.school_visits FOR UPDATE
  USING (public.user_has_school_access(auth.uid(), school_id));
