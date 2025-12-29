#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const postgres = require('postgres');

async function grantSMEStatus() {
    console.log('🎖️  Granting SME Status to Test User...\n');

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
        // Get the first user (Richard White)
        const userId = 'user_36tp39Rjz387UmDfBvHAh2WzCXr';

        console.log(`Granting SME status to user: ${userId}`);

        const result = await sql`
            UPDATE profiles
            SET is_sme = true
            WHERE id = ${userId}
            RETURNING id, full_name, email, is_sme
        `;

        if (result && result.length > 0) {
            const user = result[0];
            console.log('\n✅ SME status granted successfully!');
            console.log(`   User: ${user.full_name}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   SME Status: ${user.is_sme ? '✅ YES' : '❌ NO'}`);
            console.log(`\n🎉 ${user.full_name} can now submit expert audits!\n`);
        } else {
            console.log('❌ User not found or update failed');
        }

    } catch (error) {
        console.error('❌ Error granting SME status:', error);
        process.exit(1);
    } finally {
        await sql.end();
    }
}

grantSMEStatus();
