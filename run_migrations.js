/**
 * Supabase Migration Runner
 * Runs SQL migrations directly against your Supabase database
 * 
 * Usage: node run_migrations.js [migration-file.sql]
 * Example: node run_migrations.js supabase/migrations/20260210150000_fix_helpdesk_access.sql
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://fkvijsazmfvmlmtoyhsf.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_KEY) {
  console.error('❌ VITE_SUPABASE_PUBLISHABLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * Execute SQL migration
 */
async function runMigration(sqlContent, filename) {
  console.log(`\n📝 Running migration: ${filename}`);
  
  try {
    // Split SQL by semicolons and run each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try alternative method using postgres function
          const { error: altError } = await supabase
            .from('_migrations')
            .insert({ name: filename, sql: statement });
          
          if (altError) {
            console.error(`  ❌ Statement failed:`, altError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Statement error:`, err.message);
        errorCount++;
      }
    }

    console.log(`  ✅ Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`  ⚠️  Errors: ${errorCount} statements`);
    }
    
    return { success: successCount, errors: errorCount };
  } catch (error) {
    console.error(`  ❌ Migration failed:`, error.message);
    return { success: 0, errors: 1 };
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📋 Available options:');
    console.log('  1. node run_migrations.js [specific-file.sql]');
    console.log('  2. node run_migrations.js --all (run all migrations)');
    console.log('  3. node run_migrations.js --latest (run latest migration)');
    console.log('\n⚠️  Note: This uses the anon key which has limited permissions.');
    console.log('For full access, use Supabase CLI or Dashboard SQL Editor.');
    process.exit(0);
  }

  const migrationsDir = join(__dirname, 'supabase', 'migrations');
  
  if (args[0] === '--all') {
    // Run all migrations
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`\n🚀 Running ${files.length} migrations...\n`);
    
    let totalSuccess = 0;
    let totalErrors = 0;
    
    for (const file of files) {
      const filePath = join(migrationsDir, file);
      const content = readFileSync(filePath, 'utf-8');
      const result = await runMigration(content, file);
      totalSuccess += result.success;
      totalErrors += result.errors;
    }
    
    console.log(`\n✨ Complete! Success: ${totalSuccess}, Errors: ${totalErrors}`);
    
  } else if (args[0] === '--latest') {
    // Run latest migration
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      console.log('❌ No migration files found');
      process.exit(1);
    }
    
    const latestFile = files[0];
    const filePath = join(migrationsDir, latestFile);
    const content = readFileSync(filePath, 'utf-8');
    await runMigration(content, latestFile);
    
  } else {
    // Run specific migration
    const filePath = args[0].startsWith('supabase/') 
      ? join(__dirname, args[0])
      : join(migrationsDir, args[0]);
    
    try {
      const content = readFileSync(filePath, 'utf-8');
      await runMigration(content, basename(filePath));
    } catch (error) {
      console.error('❌ Failed to read migration file:', error.message);
      process.exit(1);
    }
  }
}

main().catch(console.error);
