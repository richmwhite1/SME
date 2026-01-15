require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');

const sql = postgres(process.env.DATABASE_URL, {
    ssl: 'require',
    max: 1
});

async function runMigration() {
    try {
        console.log('Running moderation transparency migration...');

        const migrationSQL = fs.readFileSync('migrations/postgres-moderation-transparency.sql', 'utf8');

        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!');

        await sql.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await sql.end();
        process.exit(1);
    }
}

runMigration();
