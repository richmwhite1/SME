import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Drop the old products table and rename protocols to products
 */
export async function GET() {
    const sql = getDb();

    try {
        // Drop the old products table (it has the wrong schema)
        await sql`DROP TABLE IF EXISTS products CASCADE;`;

        // Rename protocols to products
        await sql`ALTER TABLE protocols RENAME TO products;`;

        // Rename all indexes
        await sql`ALTER INDEX IF EXISTS idx_protocols_slug RENAME TO idx_products_slug;`;
        await sql`ALTER INDEX IF EXISTS idx_protocols_created_at RENAME TO idx_products_created_at;`;
        await sql`ALTER INDEX IF EXISTS idx_protocols_images RENAME TO idx_products_images;`;
        await sql`ALTER INDEX IF EXISTS idx_protocols_is_sme_certified RENAME TO idx_products_is_sme_certified;`;

        // Add is_flagged column if it doesn't exist
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;`;
        await sql`CREATE INDEX IF NOT EXISTS idx_products_is_flagged ON products(is_flagged) WHERE is_flagged = true;`;

        // Add created_by column if it doesn't exist
        await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS created_by TEXT;`;

        // Update foreign key references in reviews table if it exists
        const reviewsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reviews'
      );
    `;

        if (reviewsExists[0]?.exists) {
            await sql`
        ALTER TABLE reviews 
        DROP CONSTRAINT IF EXISTS reviews_protocol_id_fkey;
      `;

            await sql`
        ALTER TABLE reviews 
        ADD CONSTRAINT reviews_product_id_fkey 
        FOREIGN KEY (protocol_id) REFERENCES products(id) ON DELETE CASCADE;
      `;

            // Rename protocol_id column to product_id in reviews
            await sql`ALTER TABLE reviews RENAME COLUMN protocol_id TO product_id;`;
        }

        // Update discussion_comments if it has protocol_id
        const discussionCommentsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'discussion_comments'
        AND column_name = 'protocol_id'
      );
    `;

        if (discussionCommentsExists[0]?.exists) {
            await sql`ALTER TABLE discussion_comments RENAME COLUMN protocol_id TO product_id;`;

            await sql`
        ALTER TABLE discussion_comments 
        DROP CONSTRAINT IF EXISTS discussion_comments_protocol_id_fkey;
      `;

            await sql`
        ALTER TABLE discussion_comments 
        ADD CONSTRAINT discussion_comments_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
      `;
        }

        // Update global_search function to use products table
        await sql`
      CREATE OR REPLACE FUNCTION global_search(
        search_query TEXT,
        result_limit INTEGER DEFAULT 20
      )
      RETURNS TABLE (
        result_type TEXT,
        result_id UUID,
        title TEXT,
        content TEXT,
        author_name TEXT,
        created_at TIMESTAMPTZ,
        url_slug TEXT,
        tags TEXT[],
        rank REAL
      ) AS $$
      BEGIN
        RETURN QUERY
        
        -- Search Discussions
        SELECT 
          'discussion'::TEXT AS result_type,
          d.id AS result_id,
          d.title,
          d.content,
          p.full_name AS author_name,
          d.created_at,
          d.slug AS url_slug,
          d.tags,
          ts_rank(
            to_tsvector('english', d.title || ' ' || d.content),
            plainto_tsquery('english', search_query)
          ) AS rank
        FROM discussions d
        JOIN profiles p ON d.author_id = p.id
        WHERE 
          to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', search_query)
          AND (d.is_flagged = false OR d.is_flagged IS NULL)
        
        UNION ALL
        
        -- Search Products (formerly protocols)
        SELECT 
          'product'::TEXT AS result_type,
          pr.id AS result_id,
          pr.title,
          COALESCE(pr.problem_solved, pr.ai_summary, '') AS content,
          NULL::TEXT AS author_name,
          pr.created_at,
          pr.slug AS url_slug,
          NULL::TEXT[] AS tags,
          ts_rank(
            to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')),
            plainto_tsquery('english', search_query)
          ) AS rank
        FROM products pr
        WHERE 
          to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')) 
          @@ plainto_tsquery('english', search_query)
          AND (pr.is_flagged = false OR pr.is_flagged IS NULL)
        
        ORDER BY rank DESC
        LIMIT result_limit;
      END;
      $$ LANGUAGE plpgsql;
    `;

        return NextResponse.json({
            success: true,
            message: 'Successfully migrated protocols table to products table',
            details: {
                dropped: 'old products table',
                renamed: 'protocols → products',
                indexes_updated: 5,
                foreign_keys_updated: reviewsExists[0]?.exists ? 1 : 0,
                search_function_updated: true
            }
        });
    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json(
            {
                error: 'Migration failed',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
