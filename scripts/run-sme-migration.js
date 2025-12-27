#!/usr/bin/env node

/**
 * Run SME Reputation Lifecycle Migration
 * 
 * This script executes the database migration to add the is_sme column
 * and automated triggers for SME promotion/demotion.
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

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
        console.log('🚀 Running SME Reputation Lifecycle Migration...\n');

        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'sme-reputation-lifecycle.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Execute the migration
        console.log('📝 Executing migration SQL...');
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify the migration
        console.log('🔍 Verifying migration...');

        // Check if is_sme column exists
        const columnCheck = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'profiles' AND column_name = 'is_sme'
    `;

        if (columnCheck.length > 0) {
            console.log('   ✅ is_sme column added to profiles table');
        } else {
            console.log('   ❌ is_sme column NOT found');
        }

        // Check if functions exist
        const functionCheck = await sql`
      SELECT routine_name
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      AND routine_name IN (
        'calculate_user_reputation',
        'sync_sme_status',
        'recalculate_and_update_reputation',
        'update_author_reputation_on_vote'
      )
    `;

        console.log(`   ✅ Created ${functionCheck.length}/4 database functions`);

        // Check if triggers exist
        const triggerCheck = await sql`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_name IN (
        'trigger_sync_sme_status',
        'trigger_update_reputation_on_discussion_vote',
        'trigger_update_reputation_on_comment_vote'
      )
    `;

        console.log(`   ✅ Created ${triggerCheck.length}/3 database triggers\n`);

        // Show current SME users
        const smeUsers = await sql`
      SELECT id, full_name, email, reputation_score, is_sme
      FROM profiles
      WHERE is_sme = true
      ORDER BY reputation_score DESC
      LIMIT 10
    `;

        if (smeUsers.length > 0) {
            console.log('⭐ Current SME Users:');
            smeUsers.forEach(user => {
                console.log(`   - ${user.full_name || user.email}: ${user.reputation_score} points`);
            });
        } else {
            console.log('ℹ️  No users currently have SME status (reputation >= 100)');
        }

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ MIGRATION COMPLETE');
        console.log('═══════════════════════════════════════════════════');
        console.log('The SME Reputation Lifecycle system is now active.');
        console.log('Users with reputation_score >= 100 will automatically');
        console.log('have is_sme = true and access to the SME Dashboard.');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
