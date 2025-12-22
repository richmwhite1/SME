-- =====================================================
-- Enhanced Global Search RPC with Fuzzy Matching
-- =====================================================
-- Upgrades global_search to include fuzzy matching for typos
-- Uses PostgreSQL's similarity function (pg_trgm extension required)
-- =====================================================

-- First, ensure pg_trgm extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION global_search(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  result_type TEXT,
  result_id TEXT,
  result_slug TEXT,
  title TEXT,
  content TEXT,
  snippet TEXT,
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
      COALESCE(pr.problem_solved, '') AS content,
      -- Extract snippet from AI summary that contains search terms
      CASE
        WHEN pr.ai_summary IS NOT NULL AND (
          lower(pr.ai_summary) LIKE '%' || lower(search_query) || '%'
          OR similarity(lower(pr.ai_summary), lower(search_query)) > 0.2
        ) THEN
          substring(
            pr.ai_summary,
            greatest(1, 
              COALESCE(
                position(lower(search_query) in lower(pr.ai_summary)),
                position(lower(substring(search_query from 1 for 5)) in lower(pr.ai_summary))
              ) - 50
            ),
            least(200, length(pr.ai_summary))
          )
        ELSE NULL
      END AS snippet,
      pr.created_at,
      COALESCE(p.full_name, 'Unknown') AS author_name,
      p.username AS author_username,
      COALESCE(pr.is_sme_certified, false) AS is_sme_certified,
      CASE
        WHEN lower(pr.title) = lower(search_query) THEN 15
        WHEN lower(pr.title) LIKE '%' || lower(search_query) || '%' THEN 10
        WHEN similarity(lower(pr.title), lower(search_query)) > 0.3 THEN 8
        WHEN pr.ai_summary IS NOT NULL AND (
          lower(pr.ai_summary) LIKE '%' || lower(search_query) || '%'
          OR similarity(lower(pr.ai_summary), lower(search_query)) > 0.2
        ) THEN 7
        WHEN lower(pr.problem_solved) LIKE '%' || lower(search_query) || '%' THEN 5
        WHEN similarity(lower(pr.problem_solved), lower(search_query)) > 0.3 THEN 3
        ELSE 1
      END AS relevance_score
    FROM protocols pr
    LEFT JOIN profiles p ON pr.created_by = p.id
    WHERE (
      lower(pr.title) LIKE '%' || lower(search_query) || '%'
      OR lower(COALESCE(pr.problem_solved, '')) LIKE '%' || lower(search_query) || '%'
      OR (pr.ai_summary IS NOT NULL AND (
        lower(pr.ai_summary) LIKE '%' || lower(search_query) || '%'
        OR similarity(lower(pr.ai_summary), lower(search_query)) > 0.2
      ))
      OR similarity(lower(pr.title), lower(search_query)) > 0.2
      OR similarity(lower(COALESCE(pr.problem_solved, '')), lower(search_query)) > 0.2
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
        WHEN lower(d.content) LIKE '%' || lower(search_query) || '%'
          OR similarity(lower(d.content), lower(search_query)) > 0.2 THEN
          substring(
            d.content,
            greatest(1, 
              COALESCE(
                position(lower(search_query) in lower(d.content)),
                position(lower(substring(search_query from 1 for 5)) in lower(d.content))
              ) - 50
            ),
            least(200, length(d.content))
          )
        ELSE NULL
      END AS snippet,
      d.created_at,
      COALESCE(p.full_name, 'Anonymous') AS author_name,
      p.username AS author_username,
      false AS is_sme_certified,
      CASE
        WHEN lower(d.title) = lower(search_query) THEN 15
        WHEN lower(d.title) LIKE '%' || lower(search_query) || '%' THEN 10
        WHEN similarity(lower(d.title), lower(search_query)) > 0.3 THEN 8
        WHEN lower(d.content) LIKE '%' || lower(search_query) || '%' THEN 5
        WHEN similarity(lower(d.content), lower(search_query)) > 0.3 THEN 3
        ELSE 1
      END AS relevance_score
    FROM discussions d
    LEFT JOIN profiles p ON d.author_id = p.id
    WHERE (
      lower(d.title) LIKE '%' || lower(search_query) || '%'
      OR lower(d.content) LIKE '%' || lower(search_query) || '%'
      OR similarity(lower(d.title), lower(search_query)) > 0.2
      OR similarity(lower(d.content), lower(search_query)) > 0.2
    )
    AND COALESCE(d.is_flagged, false) = false
  ),
  resource_results AS (
    SELECT
      rl.origin_type::TEXT AS result_type,
      rl.origin_id::TEXT AS result_id,
      rl.origin_slug AS result_slug,
      rl.title,
      COALESCE(rl.reference_url, '') AS content,
      NULL::TEXT AS snippet,
      rl.created_at,
      COALESCE(rl.author_name, 'Unknown') AS author_name,
      rl.author_username AS author_username,
      false AS is_sme_certified,
      CASE
        WHEN lower(rl.title) LIKE '%' || lower(search_query) || '%' THEN 8
        WHEN similarity(lower(rl.title), lower(search_query)) > 0.3 THEN 6
        WHEN lower(rl.reference_url) LIKE '%' || lower(search_query) || '%' THEN 3
        ELSE 1
      END AS relevance_score
    FROM resource_library rl
    WHERE (
      lower(rl.title) LIKE '%' || lower(search_query) || '%'
      OR lower(rl.reference_url) LIKE '%' || lower(search_query) || '%'
      OR similarity(lower(rl.title), lower(search_query)) > 0.2
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
    ar.snippet,
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
COMMENT ON FUNCTION global_search IS 'Enhanced search with fuzzy matching using pg_trgm similarity. Includes AI summary snippets for contextual search.';





