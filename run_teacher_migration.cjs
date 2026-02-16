const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Use same credentials as found in existing scripts
const SUPABASE_URL = 'https://fkvijsazmfvmlmtoyhsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runMigration() {
    console.log('🚀 Executing Teacher Reference Trigger Migration (CJS)...\n');

    try {
        // Read the SQL file
        const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20260216_teacher_ref_trigger.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Applying SQL:');
        console.log('-------------------');
        console.log(sql);
        console.log('-------------------\n');

        // Execute via RPC 'exec_sql' which must exist in the project (based on other scripts using it)
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('❌ RPC Execution Failed:');
            console.error(error);
            process.exit(1);
        }

        console.log('✅ Migration executed successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Unexpected Error:', err);
        process.exit(1);
    }
}

runMigration();
