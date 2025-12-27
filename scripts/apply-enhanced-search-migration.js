#!/usr/bin/env node

/**
 * Apply enhanced global search migration
 * Adds reviews to search results and implements fuzzy ILIKE matching
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, {
    ssl: 'require',
    max: 1,
});

async function applyMigration() {
    try {
        console.log('🔄 Applying enhanced global search migration...');

        // Read the SQL file
        const migrationSQL = readFileSync(
            join(__dirname, '..', 'postgres-enhanced-global-search.sql'),
            'utf-8'
        );

        // Execute the migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration applied successfully!');
        console.log('📋 Changes:');
        console.log('  - Added reviews to search results');
        console.log('  - Added ILIKE fuzzy matching for typo tolerance');
        console.log('  - Added ts_headline for content snippets');
        console.log('  - Returns result_slug, author_username, and relevance_score');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
