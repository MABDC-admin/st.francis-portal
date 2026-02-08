CREATE TABLE public.google_docs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  url text NOT NULL,
  doc_type text NOT NULL DEFAULT 'document',
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.google_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage google docs"
ON public.google_docs FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_google_docs_updated_at
BEFORE UPDATE ON public.google_docs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();