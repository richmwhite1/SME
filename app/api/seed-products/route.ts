import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Seed the database with sample products
 */
export async function GET() {
  try {
    const sql = getDb();

    // Check if protocols table has any data
    const existingCount = await sql`SELECT COUNT(*) as count FROM protocols`;

    if (Number(existingCount[0].count) > 0) {
      return NextResponse.json({
        status: 'Database already has products',
        count: existingCount[0].count
      });
    }

    // Insert sample products
    await sql`
      INSERT INTO protocols (title, slug, problem_solved, ai_summary, buy_url, is_sme_certified, third_party_lab_verified, purity_tested, source_transparency, potency_verified, excipient_audit, operational_legitimacy)
      VALUES 
        ('Magnesium Glycinate', 'magnesium-glycinate', 'Sleep quality and muscle relaxation', 'High-absorption magnesium for better sleep and reduced muscle tension', 'https://example.com/mag', true, true, true, true, true, true, true),
        ('Omega-3 Fish Oil', 'omega-3-fish-oil', 'Heart health and inflammation', 'Premium omega-3 fatty acids for cardiovascular support', 'https://example.com/omega3', true, true, true, true, true, false, true),
        ('Vitamin D3 + K2', 'vitamin-d3-k2', 'Bone health and immune function', 'Synergistic vitamin combination for optimal calcium absorption', 'https://example.com/vitd', true, false, true, true, true, true, true),
        ('Ashwagandha Extract', 'ashwagandha-extract', 'Stress reduction and cortisol management', 'Adaptogenic herb for stress resilience and hormonal balance', 'https://example.com/ash', false, true, true, true, false, true, true),
        ('Creatine Monohydrate', 'creatine-monohydrate', 'Muscle performance and cognitive function', 'Pure creatine for strength and brain health', 'https://example.com/creatine', true, true, true, true, true, true, true)
    `;

    const newCount = await sql`SELECT COUNT(*) as count FROM protocols`;

    return NextResponse.json({
      status: 'Sample products seeded successfully',
      count: newCount[0].count
    });

  } catch (error) {
    console.error('Seeding failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed products',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
