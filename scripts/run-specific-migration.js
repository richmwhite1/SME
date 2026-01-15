const postgres = require('postgres');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const sql = postgres(process.env.DATABASE_URL);

    // Get filename from command line args
    const filename = process.argv[2];

    if (!filename) {
        console.error('Please provide a migration filename argument');
        process.exit(1);
    }

    try {
        console.log(`Reading migration file: ${filename}...`);
        const migration = fs.readFileSync(filename, 'utf8');

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
