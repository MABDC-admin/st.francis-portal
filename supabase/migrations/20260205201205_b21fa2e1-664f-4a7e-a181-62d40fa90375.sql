-- Create canva_connections table for OAuth tokens
CREATE TABLE public.canva_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  canva_user_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.canva_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access (users can only access their own connection)
CREATE POLICY "Users can view their own Canva connection" 
ON public.canva_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Canva connection" 
ON public.canva_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Canva connection" 
ON public.canva_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Canva connection" 
ON public.canva_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_canva_connections_updated_at
BEFORE UPDATE ON public.canva_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();