-- Add presentation-related columns to notebook_cells table
ALTER TABLE notebook_cells 
ADD COLUMN IF NOT EXISTS presentation_slide_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS presentation_style text DEFAULT 'modern';