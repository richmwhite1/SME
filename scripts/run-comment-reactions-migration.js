#!/usr/bin/env node

/**
 * Run Comment Reactions Migration
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

async function main() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ ERROR: DATABASE_URL environment variable is not set');
        process.exit(1);
    }

    const sql = postgres(databaseUrl, {
        ssl: 'require',
    });

    try {
        console.log('🚀 Running Comment Reactions Migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'add-comment-reactions.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        console.log('📝 Executing migration SQL...');
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify the migration
        console.log('🔍 Verifying migration...');

        // Check tables
        const tableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('discussion_comment_reactions', 'product_comment_reactions')
    `;

        console.log(`   ✅ Found ${tableCheck.length}/2 new tables`);

        // Check profile columns
        const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'profiles' 
      AND column_name IN (
        'reputation_scientific', 
        'reputation_experiential', 
        'reputation_safety', 
        'reputation_innovation', 
        'reputation_reliability'
      )
    `;

        console.log(`   ✅ Found ${columnCheck.length}/5 new profile columns`);

        // Check functions
        const functionCheck = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name = 'calculate_detailed_reputation'
    `;

        if (functionCheck.length > 0) {
            console.log('   ✅ calculate_detailed_reputation function created');
        } else {
            console.log('   ❌ calculate_detailed_reputation function NOT found');
        }

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
