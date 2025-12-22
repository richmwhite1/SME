const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function main() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error("❌ Error: DATABASE_URL is not set.");
        console.error("   Please run this script using 'railway run node scripts/production-fix-schema.js'");
        process.exit(1);
    }

    console.log("🔌 Connecting to database...");
    const sql = postgres(dbUrl, {
        ssl: { rejectUnauthorized: false }, // Required for many hosted Postgres
        max: 1
    });

    try {
        // 1. Check/Drop malformed tables to ensure clean schema application
        console.log("🔍 Checking for outdated table structures...");

        // Check notifications for 'actor_id' (missing in old schema)
        const notifCols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'notifications'
    `;
        const notifColNames = notifCols.map(c => c.column_name);

        if (notifColNames.length > 0 && !notifColNames.includes('actor_id')) {
            console.log("   ⚠️ Detected malformed 'notifications' table. Dropping...");
            await sql`DROP TABLE notifications CASCADE`;
        }

        // Check products for correct structure (renamed from protocols)
        // If 'products' table exists but is missing columns, we might need to reset it.
        // For now, let's assume if it exists it might be okay, OR we can drop it to be safe 
        // since user previously had 'protocols'.
        // Let's drop 'protocols' if it exists.
        await sql`DROP TABLE IF EXISTS protocols CASCADE`;

        // 2. Apply schema.sql
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        console.log(`📄 Applying schema from ${schemaPath}...`);

        await sql.file(schemaPath);

        console.log("✅ Schema applied successfully.");
        console.log("   - 'notifications' table ensured.");
        console.log("   - 'products' table ensured.");

    } catch (err) {
        console.error("❌ Error applying schema:", err);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

main();
