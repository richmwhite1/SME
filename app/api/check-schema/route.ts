import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Check database schema - verify table structures
 */
export async function GET() {
    try {
        const sql = getDb();

        // Check reviews table structure
        const reviewsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reviews'
      ORDER BY ordinal_position
    `;

        // Check protocols table structure
        const protocolsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'protocols'
      ORDER BY ordinal_position
    `;

        // Check products table structure
        const productsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products'
      ORDER BY ordinal_position
    `;

        // Check product_comments table structure
        const productCommentsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_comments'
      ORDER BY ordinal_position
    `;

        return NextResponse.json({
            reviews: reviewsColumns,
            protocols: protocolsColumns,
            products: productsColumns,
            product_comments: productCommentsColumns
        });

    } catch (error) {
        console.error('Schema check failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to check schema',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
