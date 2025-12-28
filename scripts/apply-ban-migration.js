
const fs = require('fs');
const path = require('path');
const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function runMigration() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, {
        ssl: 'require',
        max: 1
    });

    try {
        const migrationPath = path.join(__dirname, '../migrations/add-user-ban-columns.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('Applying ban columns migration...');
        await sql.unsafe(migrationSQL);
        console.log('Migration applied successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sql.end();
    }
}

runMigration();
