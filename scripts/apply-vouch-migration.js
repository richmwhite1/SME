#!/usr/bin/env node

/**
 * Apply vouch system migration
 * Run with: node scripts/apply-vouch-migration.js
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
        const migrationPath = path.join(__dirname, '..', 'migrations', 'vouch-system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log("📝 Applying vouch system migration...");

        // Execute the migration
        await sql.unsafe(migrationSQL);

        console.log("✅ Migration applied successfully!");

        // Verify the changes
        console.log("\n🔍 Verifying migration...");

        // Check if vouches table exists
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'vouches'
        `;

        if (tables.length > 0) {
            console.log("   ✓ vouches table created");
        }

        // Check if functions exist
        const functions = await sql`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_name IN ('submit_vouch', 'get_vouch_count', 'has_vouched')
            AND routine_schema = 'public'
        `;

        console.log(`   ✓ Found ${functions.length} vouch functions`);

        console.log("\n✨ All done! Vouch system is ready to use.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

applyMigration();
