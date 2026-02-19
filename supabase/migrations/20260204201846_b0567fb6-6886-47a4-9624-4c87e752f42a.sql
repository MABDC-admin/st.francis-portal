-- Create school_events table for calendar events
CREATE TABLE public.school_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'general',
  academic_year_id UUID REFERENCES public.academic_years(id),
  school TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view events
CREATE POLICY "Anyone can view school events"
  ON public.school_events FOR SELECT
  USING (true);

-- Only admin/registrar can manage events
CREATE POLICY "Admin and registrar can insert events"
  ON public.school_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'registrar')
    )
  );

CREATE POLICY "Admin and registrar can update events"
  ON public.school_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'registrar')
    )
  );

CREATE POLICY "Admin and registrar can delete events"
  ON public.school_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'registrar')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_school_events_updated_at
  BEFORE UPDATE ON public.school_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample events
INSERT INTO public.school_events (title, event_date, event_type, description) VALUES
  ('School Assembly', CURRENT_DATE + INTERVAL '3 days', 'assembly', 'Monthly school assembly'),
  ('Math Exam', CURRENT_DATE + INTERVAL '5 days', 'exam', 'Quarterly math examination'),
  ('Science Fair', CURRENT_DATE + INTERVAL '10 days', 'event', 'Annual science fair exhibition'),
  ('Parent-Teacher Meeting', CURRENT_DATE + INTERVAL '14 days', 'meeting', 'Quarterly parent-teacher conference'),
  ('Sports Day', CURRENT_DATE + INTERVAL '21 days', 'event', 'Annual sports day celebration');