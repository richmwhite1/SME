import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const sql = getDb();

    try {
        // 0. DEBUG: Check schema
        const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `;
        console.log('Products columns:', columns.map((c: any) => c.column_name));

        // 1. Update Resource Library View
        await sql`DROP VIEW IF EXISTS resource_library CASCADE`;

        // Check if created_by exists
        const hasCreatedBy = columns.some((c: any) => c.column_name === 'created_by');
        const hasBuyUrl = columns.some((c: any) => c.column_name === 'buy_url');
        const titleColumn = columns.some((c: any) => c.column_name === 'title') ? 'title' : 'name';
        const contentColumn = columns.some((c: any) => c.column_name === 'problem_solved') ? 'problem_solved' : 'description';
        await sql.unsafe(`
      CREATE VIEW resource_library AS
      SELECT
        'Product' AS origin_type,
        pr.id::TEXT AS origin_id,
        pr.slug AS origin_slug,
        pr.${titleColumn} AS title,
        COALESCE(pr.${hasBuyUrl ? 'buy_url' : 'slug'}, '') AS reference_url,
        pr.created_at AS created_at,
        ${hasCreatedBy ? 'p.id AS author_id, p.full_name AS author_name, p.username AS author_username' : 'NULL AS author_id, \'SME Official\' AS author_name, \'sme\' AS author_username'}
      FROM products pr
      ${hasCreatedBy ? 'LEFT JOIN profiles p ON pr.created_by = p.id' : ''}
      WHERE ${hasBuyUrl ? 'pr.buy_url' : 'pr.slug'} IS NOT NULL
        AND ${hasBuyUrl ? 'pr.buy_url' : 'pr.slug'} != ''
      UNION ALL
      SELECT
        'Discussion' AS origin_type,
        d.id::TEXT AS origin_id,
        d.slug AS origin_slug,
        d.title AS title,
        d.reference_url AS reference_url,
        d.created_at AS created_at,
        p.id AS author_id,
        p.full_name AS author_name,
        p.username AS author_username
      FROM discussions d
      LEFT JOIN profiles p ON d.author_id = p.id
      WHERE d.reference_url IS NOT NULL
        AND d.reference_url != ''
      ORDER BY created_at DESC
    `);

        // 2. Update Global Search Function
        await sql.unsafe(`
      CREATE OR REPLACE FUNCTION global_search(search_query TEXT, result_limit INTEGER DEFAULT 10)
      RETURNS TABLE (
        result_type TEXT,
        result_id TEXT,
        result_slug TEXT,
        title TEXT,
        content TEXT,
        content_snippet TEXT,
        created_at TIMESTAMP WITH TIME ZONE,
        author_name TEXT,
        author_username TEXT,
        is_sme_certified BOOLEAN,
        relevance_score INTEGER
      ) AS $$
      DECLARE
        search_lower TEXT;
        search_pattern TEXT;
      BEGIN
        search_lower := lower(trim(search_query));
        search_pattern := '%' || search_lower || '%';
        
        RETURN QUERY
        WITH product_results AS (
          SELECT
            'Product'::TEXT AS result_type,
            pr.id::TEXT AS result_id,
            pr.slug AS result_slug,
            pr.${titleColumn} AS title,
            COALESCE(pr.${contentColumn}, '') AS content,
            CASE
              WHEN lower(COALESCE(pr.${contentColumn}, '')) LIKE search_pattern THEN
                substring(
                  COALESCE(pr.${contentColumn}, ''),
                  greatest(1, position(search_lower in lower(COALESCE(pr.${contentColumn}, ''))) - 50),
                  least(200, length(COALESCE(pr.${contentColumn}, '')))
                )
              ELSE NULL
            END AS content_snippet,
            pr.created_at,
            ${hasCreatedBy ? 'COALESCE(p.full_name, \'SME Official\')' : '\'SME Official\''} AS author_name,
            ${hasCreatedBy ? 'p.username' : '\'sme\''} AS author_username,
            ${columns.some((c: any) => c.column_name === 'is_sme_certified') ? 'COALESCE(pr.is_sme_certified, false)' : 'true'} AS is_sme_certified,
            CASE
              WHEN lower(pr.${titleColumn}) = search_lower THEN 15
              WHEN lower(pr.${titleColumn}) LIKE search_pattern THEN 10
              WHEN lower(COALESCE(pr.${contentColumn}, '')) LIKE search_pattern THEN 5
              ELSE 1
            END AS relevance_score
          FROM products pr
          ${hasCreatedBy ? 'LEFT JOIN profiles p ON pr.created_by = p.id' : ''}
          WHERE (
            lower(pr.${titleColumn}) LIKE search_pattern
            OR lower(COALESCE(pr.${contentColumn}, '')) LIKE search_pattern
          )
        ),
        discussion_results AS (
          SELECT
            'Discussion'::TEXT AS result_type,
            d.id::TEXT AS result_id,
            d.slug AS result_slug,
            d.title,
            d.content,
            CASE
              WHEN lower(d.content) LIKE search_pattern THEN
                substring(
                  d.content,
                  greatest(1, position(search_lower in lower(d.content)) - 50),
                  least(200, length(d.content))
                )
              ELSE NULL
            END AS content_snippet,
            d.created_at,
            COALESCE(p.full_name, 'Anonymous') AS author_name,
            p.username AS author_username,
            false AS is_sme_certified,
            CASE
              WHEN lower(d.title) = search_lower THEN 15
              WHEN lower(d.title) LIKE search_pattern THEN 10
              WHEN lower(d.content) LIKE search_pattern THEN 5
              ELSE 1
            END AS relevance_score
          FROM discussions d
          LEFT JOIN profiles p ON d.author_id = p.id
          WHERE (
            lower(d.title) LIKE search_pattern
            OR lower(d.content) LIKE search_pattern
          )
        ),
        resource_results AS (
          SELECT
            'Evidence'::TEXT AS result_type,
            rl.origin_id::TEXT AS result_id,
            rl.origin_slug AS result_slug,
            rl.title,
            COALESCE(rl.reference_url, '') AS content,
            NULL::TEXT AS content_snippet,
            rl.created_at,
            COALESCE(rl.author_name, 'Unknown') AS author_name,
            rl.author_username AS author_username,
            false AS is_sme_certified,
            CASE
              WHEN lower(rl.title) = search_lower THEN 12
              WHEN lower(rl.title) LIKE search_pattern THEN 8
              WHEN lower(COALESCE(rl.reference_url, '')) LIKE search_pattern THEN 3
              ELSE 1
            END AS relevance_score
          FROM resource_library rl
          WHERE (
            lower(rl.title) LIKE search_pattern
            OR lower(COALESCE(rl.reference_url, '')) LIKE search_pattern
          )
        ),
        all_results AS (
          SELECT * FROM product_results
          UNION ALL
          SELECT * FROM discussion_results
          UNION ALL
          SELECT * FROM resource_results
        )
        SELECT
          ar.result_type,
          ar.result_id,
          ar.result_slug,
          ar.title,
          ar.content,
          ar.content_snippet,
          ar.created_at,
          ar.author_name,
          ar.author_username,
          ar.is_sme_certified,
          ar.relevance_score
        FROM all_results ar
        ORDER BY ar.relevance_score DESC, ar.created_at DESC
        LIMIT result_limit;
      END;
      $$ LANGUAGE plpgsql;
    `);

        return NextResponse.json({ success: true, message: 'Search setup complete' });
    } catch (error) {
        console.error('Search setup error:', error);
        return NextResponse.json(
            { success: false, error: String(error) },
            { status: 500 }
        );
    }
}
