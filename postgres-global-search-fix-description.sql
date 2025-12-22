-- =====================================================
-- Fixed Global Search RPC Function
-- =====================================================
-- Fixes the 'Bluecheese' problem by searching:
-- - protocols.description (not just title/problem_solved)
-- - discussions.content (already correct)
-- - resource_library.ai_summary (not just title/reference_url)
-- =====================================================

CREATE OR REPLACE FUNCTION global_search(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  result_type TEXT,
  result_id TEXT,
  result_slug TEXT,
  title TEXT,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  author_name TEXT,
  author_username TEXT,
  is_sme_certified BOOLEAN,
  relevance_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH search_terms AS (
    SELECT unnest(string_to_array(lower(search_query), ' ')) AS term
  ),
  product_results AS (
    SELECT
      'Product'::TEXT AS result_type,
      pr.id::TEXT AS result_id,
      pr.slug AS result_slug,
      pr.title,
      COALESCE(pr.description, pr.problem_solved, '') AS content,
      pr.created_at,
      COALESCE(p.full_name, 'Unknown') AS author_name,
      p.username AS author_username,
      COALESCE(pr.is_sme_certified, false) AS is_sme_certified,
      CASE
        WHEN lower(pr.title) LIKE '%' || lower(search_query) || '%' THEN 10
        WHEN lower(COALESCE(pr.description, '')) LIKE '%' || lower(search_query) || '%' THEN 8
        WHEN lower(COALESCE(pr.problem_solved, '')) LIKE '%' || lower(search_query) || '%' THEN 5
        ELSE 1
      END AS relevance_score
    FROM protocols pr
    LEFT JOIN profiles p ON pr.created_by = p.id
    WHERE (
      lower(pr.title) LIKE '%' || lower(search_query) || '%'
      OR lower(COALESCE(pr.description, '')) LIKE '%' || lower(search_query) || '%'
      OR lower(COALESCE(pr.problem_solved, '')) LIKE '%' || lower(search_query) || '%'
    )
    AND COALESCE(pr.is_flagged, false) = false
  ),
  discussion_results AS (
    SELECT
      'Discussion'::TEXT AS result_type,
      d.id::TEXT AS result_id,
      d.slug AS result_slug,
      d.title,
      d.content,
      d.created_at,
      COALESCE(p.full_name, 'Anonymous') AS author_name,
      p.username AS author_username,
      false AS is_sme_certified,
      CASE
        WHEN lower(d.title) LIKE '%' || lower(search_query) || '%' THEN 10
        WHEN lower(d.content) LIKE '%' || lower(search_query) || '%' THEN 5
        ELSE 1
      END AS relevance_score
    FROM discussions d
    LEFT JOIN profiles p ON d.author_id = p.id
    WHERE (
      lower(d.title) LIKE '%' || lower(search_query) || '%'
      OR lower(d.content) LIKE '%' || lower(search_query) || '%'
    )
    AND COALESCE(d.is_flagged, false) = false
  ),
  resource_results AS (
    SELECT
      rl.origin_type::TEXT AS result_type,
      rl.origin_id::TEXT AS result_id,
      rl.origin_slug AS result_slug,
      rl.title,
      COALESCE(rl.ai_summary, rl.reference_url, '') AS content,
      rl.created_at,
      COALESCE(rl.author_name, 'Unknown') AS author_name,
      rl.author_username AS author_username,
      false AS is_sme_certified,
      CASE
        WHEN lower(rl.title) LIKE '%' || lower(search_query) || '%' THEN 8
        WHEN lower(COALESCE(rl.ai_summary, '')) LIKE '%' || lower(search_query) || '%' THEN 6
        WHEN lower(COALESCE(rl.reference_url, '')) LIKE '%' || lower(search_query) || '%' THEN 3
        ELSE 1
      END AS relevance_score
    FROM resource_library rl
    WHERE (
      lower(rl.title) LIKE '%' || lower(search_query) || '%'
      OR lower(COALESCE(rl.ai_summary, '')) LIKE '%' || lower(search_query) || '%'
      OR lower(COALESCE(rl.reference_url, '')) LIKE '%' || lower(search_query) || '%'
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
    ar.created_at,
    ar.author_name,
    ar.author_username,
    ar.is_sme_certified,
    ar.relevance_score
  FROM all_results ar
  WHERE ar.relevance_score > 0
  ORDER BY ar.relevance_score DESC, ar.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION global_search IS 'Searches across protocols.description, discussions.content, and resource_library.ai_summary. Returns results with relevance scoring.';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix
-- the global search to include description and ai_summary fields.
-- =====================================================



