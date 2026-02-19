/**
 * Insert SFXSAI school record into database
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env file manually
const envContent = readFileSync('.env', 'utf-8');
const envLines = envContent.split('\n');
const env = {};
envLines.forEach(line => {
  const match = line.match(/^([^=]+)=["']?([^"']*)["']?$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function insertSchool() {
  console.log('🏫 Inserting SFXSAI school record...\n');

  try {
    // Check if school already exists
    const { data: existing, error: checkError } = await supabase
      .from('schools')
      .select('id, code, name')
      .eq('code', 'SFXSAI')
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing school:', checkError);
      process.exit(1);
    }

    if (existing) {
      console.log('✅ School already exists:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Code: ${existing.code}`);
      console.log(`   Name: ${existing.name}`);
      console.log('\n✨ No action needed!');
      return;
    }

    // Insert school record
    const { data, error } = await supabase
      .from('schools')
      .insert({
        name: 'St. Francis Xavier Smart Academy Inc',
        code: 'SFXSAI',
        is_active: true,
        address: 'Capas, Tarlac',
        region: 'Region III',
        division: 'Tarlac',
        district: 'Capas',
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
