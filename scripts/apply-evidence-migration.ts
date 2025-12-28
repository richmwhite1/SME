
import { getDb, closeDb } from '../lib/db';
import fs from 'fs';
import path from 'path';

async function runMigration() {
    const sql = getDb();

    try {
        const migrationPath = path.join(process.cwd(), 'migrations', 'add-evidence-submissions.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration: add-evidence-submissions.sql');

        await sql.unsafe(migrationSql);

        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await closeDb();
    }
}

runMigration();
