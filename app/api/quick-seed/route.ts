import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Quick seed - add sample products to database
 */
export async function GET() {
    try {
        const sql = getDb();

        // Check count
        const count = await sql`SELECT COUNT(*) as count FROM products`;

        if (Number(count[0].count) > 0) {
            return NextResponse.json({
                status: 'Products already exist',
                count: count[0].count
            });
        }

        // Insert 5 sample products
        await sql`
      INSERT INTO products (title, slug, problem_solved, ai_summary, buy_url, is_sme_certified, third_party_lab_verified, purity_tested, source_transparency, potency_verified, excipient_audit, operational_legitimacy)
      VALUES 
        ('Magnesium Glycinate', 'magnesium-glycinate', 'Improves sleep quality and reduces muscle tension', 'High-absorption magnesium supplement for better sleep and muscle relaxation', 'https://example.com/mag', true, true, true, true, true, true, true),
        ('Omega-3 Fish Oil', 'omega-3-fish-oil', 'Supports heart health and reduces inflammation', 'Premium omega-3 fatty acids from wild-caught fish', 'https://example.com/omega3', true, true, true, true, true, false, true),
        ('Vitamin D3 + K2', 'vitamin-d3-k2', 'Enhances bone health and immune function', 'Synergistic vitamin combination for optimal calcium absorption', 'https://example.com/vitd', true, false, true, true, true, true, true),
        ('Ashwagandha Extract', 'ashwagandha-extract', 'Reduces stress and manages cortisol levels', 'Adaptogenic herb for stress resilience', 'https://example.com/ash', false, true, true, true, false, true, true),
        ('Creatine Monohydrate', 'creatine-monohydrate', 'Boosts muscle performance and cognitive function', 'Pure creatine for strength and brain health', 'https://example.com/creatine', true, true, true, true, true, true, true)
    `;

        const newCount = await sql`SELECT COUNT(*) as count FROM products`;

        return NextResponse.json({
            status: 'Sample products created',
            count: newCount[0].count
        });

    } catch (error) {
        console.error('Seed failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to seed',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
