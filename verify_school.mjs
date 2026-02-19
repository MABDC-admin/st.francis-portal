/**
 * Verify SFXSAI school exists in database
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fkvijsazmfvmlmtoyhsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verify() {
  console.log('🔍 Checking schools table...\n');

  try {
    // Check all schools
    console.log('1. Querying ALL schools (no filters):');
    const { data: allSchools, error: allError } = await supabase
      .from('schools')
      .select('*');

    if (allError) {
      console.error('❌ Error querying all schools:', allError);
    } else {
      console.log(`✅ Found ${allSchools?.length || 0} school(s):`);
      console.log(JSON.stringify(allSchools, null, 2));
    }

    console.log('\n2. Querying SFXSAI specifically by code:');
    const { data: sfxsai, error: sfxsaiError } = await supabase
      .from('schools')
      .select('*')
      .eq('code', 'SFXSAI')
      .maybeSingle();

    if (sfxsaiError) {
      console.error('❌ Error querying SFXSAI:', sfxsaiError);
    } else if (sfxsai) {
      console.log('✅ SFXSAI school found:');
      console.log(JSON.stringify(sfxsai, null, 2));
    } else {
      console.error('❌ SFXSAI school NOT FOUND in database!');
      console.log('\n📋 The migration may not have been applied yet.');
      console.log('Please check Lovable deployment logs or run the SQL manually.');
    }

    console.log('\n3. Querying by name pattern:');
    const { data: byName, error: nameError } = await supabase
      .from('schools')
      .select('*')
      .or('name.ilike.%SFXSAI%,code.ilike.%SFXSAI%');

    if (nameError) {
      console.error('❌ Error querying by name:', nameError);
    } else {
      console.log(`✅ Found ${byName?.length || 0} matching school(s):`);
      console.log(JSON.stringify(byName, null, 2));
    }

  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

verify();
