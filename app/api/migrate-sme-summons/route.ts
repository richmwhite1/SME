import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        // 1. Drop and Create sme_summons table to ensure schema match
        await sql`DROP TABLE IF EXISTS sme_summons`;

        await sql`
      CREATE TABLE sme_summons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        priority INTEGER DEFAULT 1,
        lens TEXT NOT NULL,
        red_flags_count INTEGER DEFAULT 0,
        is_resolved BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // 2. Create index for performance
        await sql`
      CREATE INDEX IF NOT EXISTS idx_sme_summons_priority ON sme_summons(priority DESC) WHERE is_resolved = false
    `;

        // 3. Clear existing data (redundant after drop but good practice if logic changes)
        await sql`DELETE FROM sme_summons`;

        // 4. Fetch some products to summon
        const products = await sql`SELECT id FROM products LIMIT 5`;

        if (products.length > 0) {
            // Seed with sample summons
            const lensOptions = ['Scientific', 'Ancestral', 'Esoteric'];

            for (let i = 0; i < products.length; i++) {
                const product = products[i];
                const priority = 5 - i; // 5, 4, 3, 2, 1
                // Make the first one unresolved and high priority
                const lens = lensOptions[i % 3];
                const redFlags = (i + 1) * 2;

                await sql`
          INSERT INTO sme_summons (product_id, priority, lens, red_flags_count, is_resolved)
          VALUES (${product.id}, ${priority}, ${lens}, ${redFlags}, false)
        `;
            }
        }

        return NextResponse.json({ success: true, message: 'SME Summons table recreated and seeded' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
