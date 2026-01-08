
import postgres from 'postgres';
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    let sql;
    try {
        console.log("🚀 Starting brand management schema migration (using postgres)...\n");

        // Read DATABASE_URL from environment
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL environment variable is not set");
        }

        console.log("✓ Database URL found");

        // Read migration file
        const migrationPath = path.join(__dirname, "../migrations/brand-management-schema.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        console.log("✓ Migration file loaded");
        console.log(`  Path: ${migrationPath}`);
        console.log(`  Size: ${migrationSQL.length} characters\n`);

        // Connect to database
        sql = postgres(databaseUrl, {
            ssl: 'require',
            max: 1
        });

        console.log("📊 Executing migration...\n");

        // Execute the migration using simple query protocol if possible, or just split statements
        // postgres.js supports multiple statements in one call usually, but let's be safe and split
        // Actually, postgres.js `file` helper is best, but we loaded content.
        // We can just pass the whole string to `sql.unsafe(string)`.

        await sql.unsafe(migrationSQL);

        console.log(`\n✅ Migration completed successfully!`);

        // Verify tables were created
        console.log("🔍 Verifying tables...\n");

        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('brand_verifications', 'sme_certifications', 'product_view_metrics', 'stripe_subscriptions')
            ORDER BY table_name
        `;

        if (tables.length > 0) {
            console.log("✓ Tables verified:");
            tables.forEach((table) => {
                console.log(`  - ${table.table_name}`);
            });
        } else {
            console.log("⚠ No new tables found (they may already exist)");
        }

        // Check for columns
        const productColumns = await sql`
             SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'visit_count'
        `;
        if (productColumns.length > 0) {
            console.log("✓ 'visit_count' column exists on products table");
        } else {
            console.log("✗ 'visit_count' column MISSING on products table");
        }

        console.log("\n🎉 Brand management schema is ready!");

    } catch (error) {
        console.error("\n❌ Migration failed:");
        console.error(error);
        process.exit(1);
    } finally {
        if (sql) await sql.end();
    }
}

runMigration();
