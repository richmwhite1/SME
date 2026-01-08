#!/usr/bin/env node

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
    console.log('🔄 Starting brand management migration...\n');

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ DATABASE_URL not found in environment');
        console.error('Please ensure .env.local exists with DATABASE_URL set');
        process.exit(1);
    }

    console.log('✓ Database URL found');

    // Create database connection
    const sql = postgres(databaseUrl, {
        max: 1,
        ssl: 'require'
    });

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '..', 'migrations', 'brand-management-schema.sql');
        console.log(`✓ Reading migration from: ${migrationPath}\n`);

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

        // Execute migration
        console.log('⚙️  Executing migration...');
        await sql.unsafe(migrationSQL);
        console.log('✓ Migration executed successfully\n');

        // Verify columns were added
        console.log('📊 Verifying products table columns...');
        const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('visit_count', 'brand_owner_id', 'is_verified', 'discount_code')
      ORDER BY column_name
    `;

        columns.forEach(col => {
            console.log(`  ✓ ${col.column_name} (${col.data_type})`);
        });

        // Verify tables were created
        console.log('\n📋 Verifying new tables...');
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brand_verifications', 'sme_certifications', 'stripe_subscriptions', 'product_view_metrics')
      ORDER BY table_name
    `;

        tables.forEach(table => {
            console.log(`  ✓ ${table.table_name}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        console.log('✓ Brand dashboard should now work');
        console.log('✓ All role checks updated to use business_user');

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error.message);

        if (error.message.includes('already exists')) {
            console.log('\n⚠️  Some objects already exist - this may be okay');
            console.log('The migration may have been partially applied before');
        }

        throw error;
    } finally {
        await sql.end();
    }
}

applyMigration()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
