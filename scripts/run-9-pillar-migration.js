#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Running 9-Pillar SME Review System Migration...\n');

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is not set in .env.local');
        process.exit(1);
    }

    const sql = postgres(process.env.DATABASE_URL, {
        max: 1,
        idle_timeout: 20,
        connect_timeout: 10,
    });

    try {
        // Read migration file
        const migrationPath = path.join(__dirname, '../migrations/add-9-pillar-sme-reviews.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Executing migration: add-9-pillar-sme-reviews.sql');

        // Execute migration
        await sql.unsafe(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Create Smoke Test Omega product
        console.log('📦 Creating Smoke Test Omega product...');

        const productResult = await sql`
            INSERT INTO products (
                title,
                slug,
                brand,
                problem_solved,
                ai_summary,
                admin_status,
                is_verified,
                created_at
            )
            VALUES (
                'Smoke Test Omega',
                'smoke-test-omega',
                'Test Brand',
                'Test product for SME review system verification',
                'This is a test product created specifically for verifying the 9-pillar SME review system. It allows SMEs to submit partial reviews and verify that N/A values display correctly.',
                'approved',
                true,
                NOW()
            )
            ON CONFLICT (slug) DO UPDATE SET
                title = EXCLUDED.title,
                updated_at = NOW()
            RETURNING id, slug
        `;

        if (productResult && productResult.length > 0) {
            console.log(`✅ Smoke Test Omega created/updated: ${productResult[0].id}`);
            console.log(`   Slug: ${productResult[0].slug}`);
            console.log(`   URL: /products/${productResult[0].slug}\n`);
        }

        // Check if user needs SME status
        console.log('👤 Checking for test users...');
        const users = await sql`
            SELECT id, full_name, email, is_sme
            FROM profiles
            ORDER BY created_at DESC
            LIMIT 5
        `;

        if (users.length > 0) {
            console.log(`\n📋 Recent users (showing ${users.length}):`);
            users.forEach((user, idx) => {
                console.log(`   ${idx + 1}. ${user.full_name || 'No name'} (${user.email || 'No email'})`);
                console.log(`      ID: ${user.id}`);
                console.log(`      SME Status: ${user.is_sme ? '✅ YES' : '❌ NO'}`);
            });

            if (!users.some(u => u.is_sme)) {
                console.log('\n⚠️  No SME users found. You may want to grant SME status to a user.');
                console.log('   Run this SQL to grant SME status:');
                console.log(`   UPDATE profiles SET is_sme = true WHERE id = 'USER_ID_HERE';`);
            }
        } else {
            console.log('   No users found in database.');
        }

        console.log('\n✅ All done! Migration successful.');
        console.log('\n📝 Next steps:');
        console.log('   1. Grant SME status to a test user (if needed)');
        console.log('   2. Start the dev server: npm run dev');
        console.log('   3. Navigate to /products/smoke-test-omega');
        console.log('   4. Submit a partial SME review (fill only 4 pillars)');
        console.log('   5. Verify N/A display for unfilled pillars\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

runMigration();
