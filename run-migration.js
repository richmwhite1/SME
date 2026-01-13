const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const sql = postgres(process.env.DATABASE_URL);

    try {
        console.log('Reading migration file...');
        const migration = fs.readFileSync('postgres-add-comment-metadata.sql', 'utf8');

        console.log('Executing migration...');
        await sql.unsafe(migration);

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

run();
