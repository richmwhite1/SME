// Migration script to add enhanced product fields
// Run with: node scripts/run-enhanced-fields-migration.js

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log('🔄 Running migration: add-enhanced-product-fields.sql');

        const migrationSQL = fs.readFileSync(
            path.join(__dirname, '../migrations/add-enhanced-product-fields.sql'),
            'utf8'
        );

        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!');
        console.log('Added columns: price, manufacturer, serving_info, warnings, certifications');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
