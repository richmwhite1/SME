#!/usr/bin/env node

/**
 * Run Product Scraper Migration
 * Applies the add-product-scraper-fields.sql migration to the database
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found in environment variables');
        console.error('   Make sure .env.local exists and contains DATABASE_URL');
        process.exit(1);
    }

    console.log('🔌 Connecting to database...');

    const sql = postgres(databaseUrl);

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add-product-scraper-fields.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Running migration: add-product-scraper-fields.sql');

        // Execute migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('');
        console.log('Added columns to products table:');
        console.log('  - description (TEXT)');
        console.log('  - ingredients (JSONB)');
        console.log('  - brand_name (TEXT)');
        console.log('  - status (TEXT, default: unclaimed)');
        console.log('');
        console.log('✨ Product scraper is ready to use!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
