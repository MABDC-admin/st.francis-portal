
-- Create excalidraw_drawings table for whiteboard persistence
CREATE TABLE public.excalidraw_drawings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Drawing',
  scene_data jsonb DEFAULT '{}',
  created_by uuid NOT NULL,
  is_shared boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.excalidraw_drawings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view drawings from their school"
ON public.excalidraw_drawings FOR SELECT
TO authenticated
USING (
  public.user_has_school_access(auth.uid(), school_id)
  AND (created_by = auth.uid() OR is_shared = true)
);

CREATE POLICY "Users can create drawings"
ON public.excalidraw_drawings FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND public.user_has_school_access(auth.uid(), school_id)
);

CREATE POLICY "Users can update own drawings"
ON public.excalidraw_drawings FOR UPDATE
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own drawings"
ON public.excalidraw_drawings FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Trigger for updated_at
CREATE TRIGGER update_excalidraw_drawings_updated_at
BEFORE UPDATE ON public.excalidraw_drawings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
