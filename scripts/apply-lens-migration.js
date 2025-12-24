require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    console.log("Applying Lens-Aware Search Migration...");

    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Error: DATABASE_URL is missing from .env.local");
        process.exit(1);
    }

    // Fix known issue: duplicate prefix
    if (databaseUrl.includes("DATABASE_URL=")) {
        databaseUrl = databaseUrl.split("DATABASE_URL=").pop();
    }

    databaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

    const sql = postgres(databaseUrl, {
        ssl: 'require',
        connect_timeout: 10,
        max: 1
    });

    try {
        const migrationPath = path.join(__dirname, '../postgres-lens-search.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log("Executing migration SQL...");
        await sql.unsafe(migrationSql);

        console.log("Migration applied successfully!");
    } catch (err) {
        console.error("Migration FAILED:", err);
    } finally {
        await sql.end();
        process.exit(0);
    }
}

applyMigration();
