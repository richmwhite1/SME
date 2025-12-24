#!/usr/bin/env node

/**
 * Run Product Wizard Cloudinary Migration
 * 
 * This script applies the database migration for the Product Onboarding Wizard
 * with Cloudinary integration.
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
        const migrationPath = path.join(__dirname, '../migrations/product-wizard-cloudinary.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running migration: product-wizard-cloudinary.sql');

        // Execute migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('\n📋 Added columns to products table:');
        console.log('   - company_blurb (TEXT)');
        console.log('   - product_photos (JSONB)');
        console.log('   - youtube_link (TEXT)');
        console.log('   - technical_specs (JSONB)');
        console.log('   - brand (TEXT, if not exists)');
        console.log('   - category (TEXT, if not exists)');
        console.log('   - name (TEXT, if not exists)');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
