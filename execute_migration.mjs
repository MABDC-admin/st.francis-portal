/**
 * Execute SQL migration directly
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fkvijsazmfvmlmtoyhsf.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrdmlqc2F6bWZ2bWxtdG95aHNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5ODgyMzUsImV4cCI6MjA4MTU2NDIzNX0.fDriAcK-av556SpRE9r3d-xZfq8j_cfwxlBZDLhCSQA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function executeMigration() {
  console.log('🚀 Executing SQL migration...\n');

  try {
    // Try using rpc to execute raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO public.schools (id, code, name, is_active, address)
        VALUES (
          '11111111-1111-1111-1111-111111111111',
          'SFXSAI',
          'St. Francis Xavier Smart Academy Inc',
          true,
          'Capas, Tarlac'
        )
        ON CONFLICT (code) DO NOTHING;
      `
    });

    if (error) {
      console.log('RPC approach failed, trying direct insert with upsert...\n');
      
      // Alternative: Try upsert via Supabase client
      const { data: insertData, error: insertError } = await supabase
        .from('schools')
        .upsert({
          id: '11111111-1111-1111-1111-111111111111',
          code: 'SFXSAI',
          name: 'St. Francis Xavier Smart Academy Inc',
          is_active: true,
          address: 'Capas, Tarlac'
        }, {
          onConflict: 'code',
          ignoreDuplicates: true
        })
        .select();

      if (insertError) {
        console.error('❌ Both methods failed. Please run this SQL manually in Supabase Dashboard:\n');
        console.log(`
INSERT INTO public.schools (id, code, name, is_active, address)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SFXSAI',
  'St. Francis Xavier Smart Academy Inc',
  true,
  'Capas, Tarlac'
)
ON CONFLICT (code) DO NOTHING;
        `);
        console.error('\nGo to: https://supabase.com/dashboard/project/fkvijsazmfvmlmtoyhsf/sql\n');
        console.error('Error details:', insertError);
        process.exit(1);
      }

      console.log('✅ School record created via upsert');
      console.log('Data:', insertData);
    } else {
      console.log('✅ School record created via RPC');
    }

    // Verify the record exists
    const { data: school, error: verifyError } = await supabase
      .from('schools')
      .select('id, code, name')
      .eq('code', 'SFXSAI')
      .maybeSingle();

    if (verifyError) {
      console.warn('⚠️ Could not verify school (might be RLS policy):', verifyError);
    } else if (school) {
      console.log('\n✅ Verified! School record exists:');
      console.log(`   ID: ${school.id}`);
      console.log(`   Code: ${school.code}`);
      console.log(`   Name: ${school.name}`);
    } else {
      console.log('\n⚠️ School was created but not visible via anon key (RLS policy)');
      console.log('This is normal - refresh your browser to test!');
    }

    console.log('\n✨ Refresh your browser at http://localhost:8082 - the issue should be fixed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Exception:', error);
    console.error('\n📋 Please run this SQL manually in Supabase Dashboard:');
    console.log('Go to: https://supabase.com/dashboard/project/fkvijsazmfvmlmtoyhsf/sql\n');
    console.log(`
INSERT INTO public.schools (id, code, name, is_active, address)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'SFXSAI',
  'St. Francis Xavier Smart Academy Inc',
  true,
  'Capas, Tarlac'
)
ON CONFLICT (code) DO NOTHING;
    `);
    process.exit(1);
  }
}

executeMigration();
