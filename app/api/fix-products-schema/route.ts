import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Ensure products table has all required columns from protocols schema
 */
export async function GET() {
    const sql = getDb();

    try {
        // Add all missing columns if they don't exist
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS buy_url TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS reference_url TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS coa_url TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT;`;

        // Ensure all certification columns exist
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sme_certified BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS third_party_lab_verified BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS purity_tested BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS source_transparency BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS potency_verified BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS excipient_audit BOOLEAN DEFAULT false;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS operational_legitimacy BOOLEAN DEFAULT false;`;

        // Ensure core columns exist
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS title TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS problem_solved TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS ai_summary TEXT;`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS images TEXT[];`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();`;
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();`;

        // Create indexes if they don't exist
        await sql`CREATE INDEX IF NOT EXISTS idx_products_is_flagged ON products(is_flagged) WHERE is_flagged = true;`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_images ON products USING GIN(images);`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_is_sme_certified ON products(is_sme_certified) WHERE is_sme_certified = true;`;

        // Get column count to verify
        const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'products'
      ORDER BY ordinal_position;
    `;

        return NextResponse.json({
            success: true,
            message: 'Products table schema updated successfully',
            details: {
                total_columns: columns.length,
                columns: columns.map(c => c.column_name)
            }
        });
    } catch (error) {
        console.error('Schema fix error:', error);
        return NextResponse.json(
            {
                error: 'Schema fix failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
