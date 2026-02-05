-- Create table for temporary OAuth state storage during Canva authorization flow
CREATE TABLE public.canva_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state_key text UNIQUE NOT NULL,
  user_id uuid NOT NULL,
  code_verifier text NOT NULL,
  redirect_uri text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '10 minutes')
);

-- Index for efficient cleanup of expired states
CREATE INDEX idx_canva_oauth_states_expires ON public.canva_oauth_states(expires_at);

-- Index for fast lookup by state_key
CREATE INDEX idx_canva_oauth_states_key ON public.canva_oauth_states(state_key);

-- Enable RLS
ALTER TABLE public.canva_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only allow edge functions (service role) to manage these records
-- No user-facing policies needed since this is backend-only