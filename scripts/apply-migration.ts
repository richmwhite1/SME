import { getDb } from '../lib/db';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function migrate() {
    const sql = getDb();
    const filePath = path.join(process.cwd(), 'migrations/update-discussions-schema.sql');
    console.log(`Reading migration from: ${filePath}`);
    const migration = fs.readFileSync(filePath, 'utf-8');

    try {
        console.log('Running migration...');
        // Split by semicolon to run statements individually? 
        // Usually unsafe(file) works if driver supports multi-statement. 
        // Postgres.js supports it but it's safer to ensure.
        // For now, let's try assuming it works or split simple.
        await sql.unsafe(migration);
        console.log('Migration applied successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        process.exit(0);
    }
}

migrate();
