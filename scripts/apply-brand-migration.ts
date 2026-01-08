import { getDb } from '@/lib/db';
import fs from 'fs';
import path from 'path';

async function applyBrandManagementMigration() {
    console.log('🔄 Applying brand management migration...');

    const sql = getDb();

    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'migrations', 'brand-management-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    try {
        // Execute the migration
        await sql.unsafe(migrationSQL);
        console.log('✅ Brand management migration applied successfully!');

        // Verify the visit_count column was added
        const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('visit_count', 'brand_owner_id', 'is_verified', 'discount_code')
      ORDER BY column_name
    `;

        console.log('\n📊 Verified columns in products table:');
        result.forEach((col: any) => {
            console.log(`  ✓ ${col.column_name} (${col.data_type})`);
        });

        // Check for new tables
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('brand_verifications', 'sme_certifications', 'stripe_subscriptions', 'product_view_metrics')
      ORDER BY table_name
    `;

        console.log('\n📋 Verified new tables:');
        tables.forEach((table: any) => {
            console.log(`  ✓ ${table.table_name}`);
        });

        console.log('\n🎉 Migration complete! Brand dashboard should now work.');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await sql.end();
    }
}

applyBrandManagementMigration()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
