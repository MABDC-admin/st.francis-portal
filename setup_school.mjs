/**
 * Insert SFXSAI school record into database
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fkvijsazmfvmlmtoyhsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function insertSchool() {
  console.log('🏫 Checking SFXSAI school record...\n');

  try {
    // Check if school already exists
    const { data: existing, error: checkError } = await supabase
      .from('schools')
      .select('id, code, name')
      .eq('code', 'SFXSAI')
      .maybeSingle();

    console.log('Check result:', { existing, checkError });

    if (checkError) {
      console.error('❌ Error checking existing school:', checkError);
      process.exit(1);
    }

    if (existing) {
      console.log('✅ School already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Code: ${existing.code}`);
      console.log(`   Name: ${existing.name}`);
      console.log('\n✨ No action needed! The "Loading school context..." issue should be resolved.');
      process.exit(0);
    }

    console.log('School not found, attempting to insert...');

    // Insert school record
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: 'St. Francis Xavier Smart Academy Inc',
        code: 'SFXSAI',
        is_active: true,
        address: 'Capas, Tarlac',
        contact_number: null,
        email: null,
        principal_name: null
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error inserting school:', error);
      process.exit(1);
    }

    console.log('✅ School inserted successfully:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Code: ${data.code}`);
    console.log(`   Name: ${data.name}`);
    console.log('\n✨ You can now access the Academic Years page!');
  } catch (error) {
    console.error('❌ Exception:', error);
    process.exit(1);
  }
}

insertSchool();
