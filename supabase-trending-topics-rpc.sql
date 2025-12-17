-- =====================================================
-- Trending Topics RPC Function
-- =====================================================
-- Creates a function to get top trending topics based on
-- Trusted Voice posts from the last 7 days
-- =====================================================

CREATE OR REPLACE FUNCTION get_trending_topics(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  topic_name TEXT,
  post_count BIGINT,
  signal_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_counts AS (
    -- Count discussions from Trusted Voices in last 7 days
    SELECT 
      unnest(d.tags) AS topic,
      COUNT(*) AS count
    FROM discussions d
    INNER JOIN profiles p ON d.author_id = p.id
    WHERE d.is_flagged = false
      AND p.badge_type = 'Trusted Voice'
      AND d.created_at >= NOW() - INTERVAL '7 days'
      AND d.tags IS NOT NULL
      AND array_length(d.tags, 1) > 0
    GROUP BY unnest(d.tags)
    
    UNION ALL
    
    -- Count products/protocols from Trusted Voices in last 7 days
    SELECT 
      unnest(pr.tags) AS topic,
      COUNT(*) AS count
    FROM protocols pr
    INNER JOIN profiles p ON pr.created_by = p.id
    WHERE COALESCE(pr.is_flagged, false) = false
      AND p.badge_type = 'Trusted Voice'
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
    END AS signal_score
  FROM aggregated_counts ac
  ORDER BY ac.total_count DESC, ac.topic_name ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION get_trending_topics IS 'Returns top trending topics based on Trusted Voice posts from last 7 days';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the trending topics RPC function.
-- =====================================================

