#!/usr/bin/env node

/**
 * Apply admin approval queue migration
 * Run with: node scripts/apply-admin-approval-migration.js
 */

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function applyMigration() {
    // Load environment variables from .env.local
    const envPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        });
    }

    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
        console.error("Error: DATABASE_URL is missing from .env.local");
        process.exit(1);
    }

    // Clean up DATABASE_URL if it has prefix
    if (databaseUrl.includes("DATABASE_URL=")) {
        databaseUrl = databaseUrl.split("DATABASE_URL=").pop();
    }

    console.log("🔌 Connecting to database...");
    const sql = postgres(databaseUrl);

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'admin-approval-queue.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log("📝 Applying admin approval queue migration...");

        // Execute the migration
        await sql.unsafe(migrationSQL);

        console.log("✅ Migration applied successfully!");

        // Verify the changes
        console.log("\n🔍 Verifying migration...");

        // Check if columns exist
        const columns = await sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name IN ('certification_tier', 'admin_notes')
        `;

        console.log(`   ✓ Found ${columns.length} new columns in products table`);

        // Check if view exists
        const views = await sql`
            SELECT table_name 
            FROM information_schema.views 
            WHERE table_name = 'admin_approval_queue'
        `;

        if (views.length > 0) {
            console.log("   ✓ admin_approval_queue view created");
        }

        console.log("\n✨ All done! Admin approval dashboard is ready to use.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyMigration();
