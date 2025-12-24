#!/usr/bin/env node

/**
 * Run SME Signals Migration
 * 
 * This script applies the database migration for sme_signals and truth_evidence_urls.
 */

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL environment variable is not set');
        console.error('   Please check your .env.local file');
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');
    const sql = postgres(databaseUrl);

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add-sme-signals.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration: add-sme-signals.sql');

        // Execute migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('\n📋 Added columns to products table:');
        console.log('   - sme_signals (JSONB)');
        console.log('   - truth_evidence_urls (JSONB)');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
