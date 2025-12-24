import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * API route to seed test data for the LiveLedger component
 */
export async function GET() {
    const sql = getDb();
    const logs: string[] = [];

    try {
        logs.push('Starting LiveLedger test data seeding...');

        // 1. Create some test vouches (promotions)
        try {
            // First, ensure we have some test users with appropriate tiers
            const testUsers = await sql`
        SELECT id FROM profiles 
        WHERE reputation_tier >= 3 
        LIMIT 2
      `;

            if (testUsers.length >= 2) {
                const voucher = testUsers[0];
                const target = testUsers[1];

                // Create a vouch
                await sql`
          INSERT INTO vouches (voucher_id, target_user_id, created_at)
          VALUES (${voucher.id}, ${target.id}, NOW() - INTERVAL '5 minutes')
          ON CONFLICT (voucher_id, target_user_id) DO NOTHING
        `;

                logs.push('✓ Created test vouch (promotion activity)');
            } else {
                logs.push('⚠ Not enough SME users to create vouch test data');
            }
        } catch (e: any) {
            logs.push(`⚠ Vouch seeding skipped: ${e.message}`);
        }

        // 2. Update some products to have certification tiers
        try {
            const products = await sql`
        SELECT id FROM products 
        WHERE admin_status = 'approved' OR admin_status IS NULL
        LIMIT 3
      `;

            if (products.length > 0) {
                // Assign different certification tiers
                const tiers = ['Gold', 'Silver', 'Bronze'];

                for (let i = 0; i < Math.min(products.length, 3); i++) {
                    await sql`
            UPDATE products 
            SET 
              certification_tier = ${tiers[i]},
              admin_status = 'approved',
              updated_at = NOW() - INTERVAL '${i * 2} minutes'
            WHERE id = ${products[i].id}
          `;
                }

                logs.push(`✓ Updated ${Math.min(products.length, 3)} products with certification tiers (signal activity)`);
            } else {
                logs.push('⚠ No products found to update');
            }
        } catch (e: any) {
            logs.push(`⚠ Product update skipped: ${e.message}`);
        }

        // 3. Create an SME application approval
        try {
            const pendingUser = await sql`
        SELECT id FROM profiles 
        WHERE reputation_tier < 3 
        LIMIT 1
      `;

            if (pendingUser.length > 0) {
                // Create an application
                await sql`
          INSERT INTO sme_applications (
            user_id, 
            expertise_lens, 
            statement_of_intent, 
            status, 
            reviewed_at,
            created_at
          )
          VALUES (
            ${pendingUser[0].id},
            'Scientific',
            'Test application for SME status',
            'approved',
            NOW() - INTERVAL '10 minutes',
            NOW() - INTERVAL '1 hour'
          )
          ON CONFLICT (user_id) DO UPDATE
          SET 
            status = 'approved',
            reviewed_at = NOW() - INTERVAL '10 minutes'
        `;

                logs.push('✓ Created test SME application approval (certification activity)');
            } else {
                logs.push('⚠ No eligible users for SME application');
            }
        } catch (e: any) {
            logs.push(`⚠ SME application seeding skipped: ${e.message}`);
        }

        // 4. Query the view to show results
        const activities = await sql`
      SELECT 
        activity_type,
        actor_name,
        target_name,
        detail,
        created_at
      FROM live_ledger_activity
      LIMIT 10
    `;

        logs.push(`\n✓ LiveLedger now has ${activities.length} activity entries`);

        if (activities.length > 0) {
            logs.push('\nSample activities:');
            activities.forEach((entry, i) => {
                logs.push(`  ${i + 1}. [${entry.activity_type}] ${entry.actor_name} → ${entry.target_name} (${entry.detail})`);
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Test data seeded successfully',
            logs,
            activityCount: activities.length,
            sampleData: activities
        });

    } catch (error: any) {
        logs.push(`✗ Error: ${error.message}`);
        console.error('Seeding error:', error);

        return NextResponse.json({
            success: false,
            error: error.message,
            logs
        }, { status: 500 });
    }
}
