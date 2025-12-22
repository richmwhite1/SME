-- =====================================================
-- Universal Global Search RPC Function
-- =====================================================
-- Truly universal search that finds discussions like 'bluecheese'
-- Returns content snippets with highlighted search terms
-- Less restrictive matching for better discovery
-- =====================================================

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
  -- Normalize search query
  search_lower := lower(trim(search_query));
  search_pattern := '%' || search_lower || '%';
  
  RETURN QUERY
  WITH product_results AS (
    SELECT
      'Product'::TEXT AS result_type,
      pr.id::TEXT AS result_id,
      pr.slug AS result_slug,
      pr.title,
      COALESCE(pr.problem_solved, pr.description, '') AS content,
      -- Extract snippet from content that contains search terms
      CASE
        WHEN lower(COALESCE(pr.problem_solved, pr.description, '')) LIKE search_pattern THEN
          substring(
            COALESCE(pr.problem_solved, pr.description, ''),
            greatest(1, position(search_lower in lower(COALESCE(pr.problem_solved, pr.description, ''))) - 50),
            least(200, length(COALESCE(pr.problem_solved, pr.description, '')))
          )
        WHEN pr.ai_summary IS NOT NULL AND lower(pr.ai_summary) LIKE search_pattern THEN
          substring(
            pr.ai_summary,
            greatest(1, position(search_lower in lower(pr.ai_summary)) - 50),
            least(200, length(pr.ai_summary))
          )
        ELSE NULL
      END AS content_snippet,
      pr.created_at,
      COALESCE(p.full_name, 'Unknown') AS author_name,
      p.username AS author_username,
      COALESCE(pr.is_sme_certified, false) AS is_sme_certified,
      CASE
        WHEN lower(pr.title) = search_lower THEN 15
        WHEN lower(pr.title) LIKE search_pattern THEN 10
        WHEN lower(COALESCE(pr.problem_solved, pr.description, '')) LIKE search_pattern THEN 5
        WHEN pr.ai_summary IS NOT NULL AND lower(pr.ai_summary) LIKE search_pattern THEN 4
        ELSE 1
      END AS relevance_score
    FROM protocols pr
    LEFT JOIN profiles p ON pr.created_by = p.id
    WHERE (
      lower(pr.title) LIKE search_pattern
      OR lower(COALESCE(pr.problem_solved, pr.description, '')) LIKE search_pattern
      OR (pr.ai_summary IS NOT NULL AND lower(pr.ai_summary) LIKE search_pattern)
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
      -- Extract snippet from discussion content
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
    AND COALESCE(d.is_flagged, false) = false
  ),
  resource_results AS (
    SELECT
      'Evidence'::TEXT AS result_type,
      rl.origin_id::TEXT AS result_id,
      rl.origin_slug AS result_slug,
      rl.title,
      COALESCE(rl.reference_url, '') AS content,
      -- Extract snippet from AI summary if available
      CASE
        WHEN rl.ai_summary IS NOT NULL AND lower(rl.ai_summary) LIKE search_pattern THEN
          substring(
            rl.ai_summary,
            greatest(1, position(search_lower in lower(rl.ai_summary)) - 50),
            least(200, length(rl.ai_summary))
          )
        ELSE NULL
      END AS content_snippet,
      rl.created_at,
      COALESCE(rl.author_name, 'Unknown') AS author_name,
      rl.author_username AS author_username,
      false AS is_sme_certified,
      CASE
        WHEN lower(rl.title) = search_lower THEN 12
        WHEN lower(rl.title) LIKE search_pattern THEN 8
        WHEN rl.ai_summary IS NOT NULL AND lower(rl.ai_summary) LIKE search_pattern THEN 6
        WHEN lower(COALESCE(rl.reference_url, '')) LIKE search_pattern THEN 3
        ELSE 1
      END AS relevance_score
    FROM resource_library rl
    WHERE (
      lower(rl.title) LIKE search_pattern
      OR (rl.ai_summary IS NOT NULL AND lower(rl.ai_summary) LIKE search_pattern)
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

-- Add comment
COMMENT ON FUNCTION global_search IS 'Universal search across protocols (Product), discussions (Community), and resource_library (Evidence). Returns content snippets with highlighted search terms. Less restrictive matching for better discovery.';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the universal global search RPC function.
-- =====================================================



