import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://fkvijsazmfvmlmtoyhsf.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA";

const supabase = createClient(supabaseUrl, supabaseKey);

const charles = {
    student_name: 'CHARLES AARON DADULA CAMAGONG',
    lrn: '121420180004',
    level: 'Grade 7',
    school: 'STFXSA',
    school_id: '22222222-2222-2222-2222-222222222222',
    academic_year_id: '74fb8614-8b9d-49d8-ac4a-7f4c74df201e',
    birth_date: '2013-01-17',
    gender: 'Male',
    mother_maiden_name: 'CHARY SANCHEZ DADULA',
    father_name: 'ARNOLD VALERIO CAMAGONG',
    phil_address: 'CONALUM, INOPACAN',
    religion: 'Christianity',
    age: 12,
    mother_tongue: 'Cebuano / Sinugbuanong Binisaya',
    dialects: 'English'
};

async function enroll() {
    console.log('Enrolling student:', charles.student_name);

    const { data, error } = await supabase
        .from('students')
        .insert([charles])
        .select();

    if (error) {
        console.error('Enrollment failed:', JSON.stringify(error, null, 2));
        process.exit(1);
    }

    console.log('Enrollment successful:', JSON.stringify(data, null, 2));
}

enroll();
