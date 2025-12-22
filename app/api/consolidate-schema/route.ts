import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Consolidate protocols table into products table
 * Drop protocols table and ensure products has all fields
 */
export async function GET() {
    try {
        const sql = getDb();

        // First, check if products table exists and has the right structure
        await sql`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        problem_solved TEXT,
        ai_summary TEXT,
        buy_url TEXT,
        reference_url TEXT,
        images TEXT[],
        is_sme_certified BOOLEAN DEFAULT false,
        third_party_lab_verified BOOLEAN DEFAULT false,
        purity_tested BOOLEAN DEFAULT false,
        source_transparency BOOLEAN DEFAULT false,
        potency_verified BOOLEAN DEFAULT false,
        excipient_audit BOOLEAN DEFAULT false,
        operational_legitimacy BOOLEAN DEFAULT false,
        coa_url TEXT,
        is_flagged BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

        // Copy any data from protocols to products if protocols exists
        try {
            await sql`
        INSERT INTO products (id, title, slug, problem_solved, ai_summary, buy_url, reference_url, images, 
                             is_sme_certified, third_party_lab_verified, purity_tested, source_transparency,
                             potency_verified, excipient_audit, operational_legitimacy, coa_url, created_at, updated_at)
        SELECT id, title, slug, problem_solved, ai_summary, buy_url, reference_url, images,
               is_sme_certified, third_party_lab_verified, purity_tested, source_transparency,
               potency_verified, excipient_audit, operational_legitimacy, coa_url, created_at, updated_at
        FROM protocols
        ON CONFLICT (id) DO NOTHING
      `;
        } catch (err) {
            console.log('No data to copy from protocols or table does not exist');
        }

        // Update foreign key references from protocol_id to product_id
        await sql`
      ALTER TABLE reviews 
      DROP CONSTRAINT IF EXISTS reviews_protocol_id_fkey
    `;

        await sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE
    `;

        // Copy protocol_id to product_id if it exists
        try {
            await sql`
        UPDATE reviews 
        SET product_id = protocol_id 
        WHERE protocol_id IS NOT NULL AND product_id IS NULL
      `;
        } catch (err) {
            console.log('protocol_id column does not exist in reviews');
        }

        // Drop protocol_id column from reviews
        await sql`
      ALTER TABLE reviews 
      DROP COLUMN IF EXISTS protocol_id
    `;

        // Update product_comments table
        await sql`
      ALTER TABLE product_comments 
      DROP CONSTRAINT IF EXISTS product_comments_protocol_id_fkey
    `;

        await sql`
      ALTER TABLE product_comments 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE
    `;

        try {
            await sql`
        UPDATE product_comments 
        SET product_id = protocol_id 
        WHERE protocol_id IS NOT NULL AND product_id IS NULL
      `;
        } catch (err) {
            console.log('protocol_id column does not exist in product_comments');
        }

        await sql`
      ALTER TABLE product_comments 
      DROP COLUMN IF EXISTS protocol_id
    `;

        // Drop the protocols table
        await sql`DROP TABLE IF EXISTS protocols CASCADE`;

        // Create indexes on products table
        await sql`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_is_sme_certified ON products(is_sme_certified) WHERE is_sme_certified = true`;

        // Verify the final state
        const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('products', 'protocols')
      ORDER BY table_name
    `;

        const productsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position
    `;

        return NextResponse.json({
            status: 'Schema consolidated successfully',
            tables: tables.map(t => t.table_name),
            products_columns: productsColumns.map(c => c.column_name)
        });

    } catch (error) {
        console.error('Schema consolidation failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to consolidate schema',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
