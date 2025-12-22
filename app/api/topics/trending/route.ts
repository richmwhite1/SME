import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '5', 10);

    const sql = getDb();

    // Use the get_trending_topics function if it exists, otherwise implement the logic in SQL
    try {
      const result = await sql`
        SELECT 
          topic_name,
          post_count::BIGINT as post_count,
          signal_score::INTEGER as signal_score
        FROM get_trending_topics(${limit})
      `;

      return NextResponse.json(result);
    } catch (functionError) {
      // Fallback: implement trending topics logic directly in SQL
      console.warn('get_trending_topics function not found, using SQL fallback');

      const result = await sql`
        WITH topic_counts AS (
          -- Count discussions from last 7 days
          SELECT 
            unnest(d.tags) AS topic,
            COUNT(*) AS count
          FROM discussions d
          WHERE d.is_flagged = false
            AND d.created_at >= NOW() - INTERVAL '7 days'
            AND d.tags IS NOT NULL
            AND array_length(d.tags, 1) > 0
          GROUP BY unnest(d.tags)
          
          UNION ALL
          
          -- Count products/protocols from last 7 days
          SELECT 
            unnest(pr.tags) AS topic,
            COUNT(*) AS count
          FROM protocols pr
          WHERE COALESCE(pr.is_flagged, false) = false
            AND pr.created_at >= NOW() - INTERVAL '7 days'
            AND pr.tags IS NOT NULL
            AND array_length(pr.tags, 1) > 0
          GROUP BY unnest(pr.tags)
        ),
        aggregated_counts AS (
          SELECT 
            topic AS topic_name,
            SUM(count) AS total_count
          FROM topic_counts
          GROUP BY topic
        )
        SELECT 
          ac.topic_name,
          ac.total_count::BIGINT AS post_count,
          CASE 
            WHEN ac.total_count >= 10 THEN 5
            WHEN ac.total_count >= 7 THEN 4
            WHEN ac.total_count >= 5 THEN 3
            WHEN ac.total_count >= 3 THEN 2
            ELSE 1
          END::INTEGER AS signal_score
        FROM aggregated_counts ac
        ORDER BY ac.total_count DESC, ac.topic_name ASC
        LIMIT ${limit}
      `;

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' },
      { status: 500 }
    );
  }
}






