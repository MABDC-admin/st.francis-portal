-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    lrn TEXT,
    action TEXT NOT NULL, -- e.g., 'login_attempt', 'login_success', 'login_failure'
    status TEXT NOT NULL, -- e.g., 'success', 'failure'
    ip_address TEXT,
    country_code TEXT,
    city TEXT,
    user_agent TEXT,
    error_message TEXT,
    school TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow insert from anon (during login)
CREATE POLICY "Allow public insert for audit logs"
    ON audit_logs
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Create policy to allow service role/admin to read
CREATE POLICY "Allow authenticated to view audit logs"
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_lrn ON audit_logs(lrn);
