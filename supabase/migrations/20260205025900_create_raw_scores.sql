-- Create raw_scores table for DepEd Transmutation System
CREATE TABLE IF NOT EXISTS public.raw_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id) ON DELETE SET NULL,
    quarter INT NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    
    -- Written Work (Raw Scores and Max Scores stored as arrays)
    ww_scores NUMERIC[] DEFAULT '{}',
    ww_max_scores NUMERIC[] DEFAULT '{}',
    
    -- Performance Tasks (Raw Scores and Max Scores stored as arrays)
    pt_scores NUMERIC[] DEFAULT '{}',
    pt_max_scores NUMERIC[] DEFAULT '{}',
    
    -- Quarterly Assessment
    qa_score NUMERIC DEFAULT 0,
    qa_max NUMERIC DEFAULT 100,
    
    -- Computed Summary
    initial_grade NUMERIC,
    transmuted_grade INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to ensure one record per student/subject/ay/quarter
    UNIQUE(student_id, subject_id, academic_year_id, quarter)
);

-- Enable RLS
ALTER TABLE public.raw_scores ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all access for authenticated users" ON public.raw_scores
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Add to realtime
ALTER PUBLICATION supabase_realtime ADD TABLE raw_scores;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_raw_scores_student ON public.raw_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_raw_scores_subject ON public.raw_scores(subject_id);
