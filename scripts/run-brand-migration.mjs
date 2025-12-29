import { neon } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        console.log("🚀 Starting brand management schema migration...\n");

        // Read DATABASE_URL from environment
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error("DATABASE_URL environment variable is not set");
        }

        console.log("✓ Database connection configured");

        // Read migration file
        const migrationPath = path.join(__dirname, "migrations", "brand-management-schema.sql");
        const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

        console.log("✓ Migration file loaded");
        console.log(`  Path: ${migrationPath}`);
        console.log(`  Size: ${migrationSQL.length} characters\n`);

        // Connect to database
        const sql = neon(databaseUrl);

        console.log("📊 Executing migration...\n");

        // Execute the migration
        // Split by semicolons and execute each statement
        const statements = migrationSQL
            .split(";")
            .map((s) => s.trim())
            .filter((s) => s.length > 0 && !s.startsWith("--"));

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ";";

            // Skip comments
            if (statement.trim().startsWith("--")) continue;

            try {
                await sql(statement);
                successCount++;

                // Log progress for major operations
                if (statement.includes("CREATE TABLE")) {
                    const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
                    if (match) {
                        console.log(`  ✓ Created table: ${match[1]}`);
                    }
                } else if (statement.includes("ALTER TABLE")) {
                    const match = statement.match(/ALTER TABLE (\w+)/i);
                    if (match) {
                        console.log(`  ✓ Altered table: ${match[1]}`);
                    }
                } else if (statement.includes("CREATE OR REPLACE FUNCTION")) {
                    const match = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/i);
                    if (match) {
                        console.log(`  ✓ Created function: ${match[1]}`);
                    }
                }
            } catch (error) {
                // Some errors are expected (e.g., column already exists)
                if (error.message.includes("already exists")) {
                    console.log(`  ⚠ Skipped (already exists): ${error.message.split("\n")[0]}`);
                } else {
                    console.error(`  ✗ Error: ${error.message.split("\n")[0]}`);
                    errorCount++;
                }
            }
        }

        console.log(`\n✅ Migration completed!`);
        console.log(`   Successful: ${successCount}`);
        console.log(`   Errors: ${errorCount}`);
        console.log(`   Total statements: ${statements.length}\n`);

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
            console.log("✓ New tables created:");
            tables.forEach((table) => {
                console.log(`  - ${table.table_name}`);
            });
        } else {
            console.log("⚠ No new tables found (they may already exist)");
        }

        console.log("\n🎉 Brand management schema is ready!");

    } catch (error) {
        console.error("\n❌ Migration failed:");
        console.error(error);
        process.exit(1);
    }
}

runMigration();
