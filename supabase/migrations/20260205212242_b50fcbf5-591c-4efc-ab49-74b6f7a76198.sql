-- Create notebooks table for storing user notebooks
CREATE TABLE public.notebooks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    school TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notebook_cells table for storing individual cells
CREATE TABLE public.notebook_cells (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    notebook_id UUID NOT NULL REFERENCES public.notebooks(id) ON DELETE CASCADE,
    cell_type TEXT NOT NULL DEFAULT 'markdown',
    content TEXT NOT NULL DEFAULT '',
    output TEXT,
    position INTEGER NOT NULL DEFAULT 0,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notebook_cells ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notebooks table
-- Users can view their own notebooks
CREATE POLICY "Users can view own notebooks"
ON public.notebooks
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all notebooks
CREATE POLICY "Admins can view all notebooks"
ON public.notebooks
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can create their own notebooks
CREATE POLICY "Users can create own notebooks"
ON public.notebooks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notebooks
CREATE POLICY "Users can update own notebooks"
ON public.notebooks
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notebooks
CREATE POLICY "Users can delete own notebooks"
ON public.notebooks
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all notebooks
CREATE POLICY "Admins can manage all notebooks"
ON public.notebooks
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for notebook_cells table
-- Users can view cells from their own notebooks
CREATE POLICY "Users can view cells from own notebooks"
ON public.notebook_cells
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = notebook_cells.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

-- Admins can view all cells
CREATE POLICY "Admins can view all cells"
ON public.notebook_cells
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Users can create cells in their own notebooks
CREATE POLICY "Users can create cells in own notebooks"
ON public.notebook_cells
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = notebook_cells.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

-- Users can update cells in their own notebooks
CREATE POLICY "Users can update cells in own notebooks"
ON public.notebook_cells
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = notebook_cells.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

-- Users can delete cells from their own notebooks
CREATE POLICY "Users can delete cells from own notebooks"
ON public.notebook_cells
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.notebooks
        WHERE notebooks.id = notebook_cells.notebook_id
        AND notebooks.user_id = auth.uid()
    )
);

-- Admins can manage all cells
CREATE POLICY "Admins can manage all cells"
ON public.notebook_cells
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX idx_notebooks_user_id ON public.notebooks(user_id);
CREATE INDEX idx_notebook_cells_notebook_id ON public.notebook_cells(notebook_id);
CREATE INDEX idx_notebook_cells_position ON public.notebook_cells(notebook_id, position);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_notebook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_notebooks_updated_at
BEFORE UPDATE ON public.notebooks
FOR EACH ROW
EXECUTE FUNCTION public.update_notebook_updated_at();

CREATE TRIGGER update_notebook_cells_updated_at
BEFORE UPDATE ON public.notebook_cells
FOR EACH ROW
EXECUTE FUNCTION public.update_notebook_updated_at();