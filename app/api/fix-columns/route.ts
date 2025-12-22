import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Fix product_comments table - add product_id column
 */
export async function GET() {
    try {
        const sql = getDb();

        // Add product_id column if it doesn't exist
        await sql`
      ALTER TABLE product_comments 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE
    `;

        // Copy protocol_id to product_id if protocol_id exists
        try {
            await sql`
        UPDATE product_comments 
        SET product_id = protocol_id 
        WHERE protocol_id IS NOT NULL AND product_id IS NULL
      `;
        } catch (err) {
            console.log('protocol_id column does not exist in product_comments, skipping migration');
        }

        // Drop protocol_id column if it exists
        await sql`
      ALTER TABLE product_comments 
      DROP COLUMN IF EXISTS protocol_id
    `;

        // Also fix reviews table
        await sql`
      ALTER TABLE reviews 
      ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE
    `;

        try {
            await sql`
        UPDATE reviews 
        SET product_id = protocol_id 
        WHERE protocol_id IS NOT NULL AND product_id IS NULL
      `;
        } catch (err) {
            console.log('protocol_id column does not exist in reviews, skipping migration');
        }

        await sql`
      ALTER TABLE reviews 
      DROP COLUMN IF EXISTS protocol_id
    `;

        // Verify columns
        const productCommentsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'product_comments'
      ORDER BY ordinal_position
    `;

        const reviewsColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reviews'
      ORDER BY ordinal_position
    `;

        return NextResponse.json({
            status: 'Tables updated successfully',
            product_comments_columns: productCommentsColumns.map(c => c.column_name),
            reviews_columns: reviewsColumns.map(c => c.column_name)
        });

    } catch (error) {
        console.error('Table update failed:', error);
        return NextResponse.json(
            {
                error: 'Failed to update tables',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
