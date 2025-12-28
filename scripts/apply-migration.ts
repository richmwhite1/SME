
import { getDb, closeDb } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const sql = getDb();

    try {
        const migrationPath = path.join(process.cwd(), 'migrations', 'add-unified-votes-and-reactions.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration...');
        // Split by semicolons carefully? Or just run as one block?
        // Postgres.js `sql.file` executes a file. But that takes a path.
        // Or `sql(string)` can execute multiple statements? 
        // Usually simple `sql` call can handle it if it's simple enough, but `BEGIN... END` blocks help.
        // Postgres.js handles simple strings.

        await sql.unsafe(migrationSql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDb();
    }
}

runMigration();
