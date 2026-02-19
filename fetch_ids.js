import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fkvijsazmfvmlmtoyhsf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('--- SCHOOLS ---');
    const { data: schools, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, code');
    if (schoolError) console.error(JSON.stringify(schoolError));
    else console.log(JSON.stringify(schools, null, 2));

    console.log('\n--- ACADEMIC YEARS ---');
    const { data: years, error: yearError } = await supabase
        .from('academic_years')
        .select('id, name, school_id, is_current');
    if (yearError) console.error(JSON.stringify(yearError));
    else console.log(JSON.stringify(years, null, 2));
}

main();
