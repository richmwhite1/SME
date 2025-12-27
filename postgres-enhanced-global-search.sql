-- =====================================================
-- ENHANCED GLOBAL SEARCH FUNCTION
-- =====================================================
-- Upgrades global_search to include reviews and fuzzy matching
-- Run this migration to update the search function

DROP FUNCTION IF EXISTS global_search(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION global_search(
  search_query TEXT,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  result_type TEXT,
  result_id UUID,
  result_slug TEXT,
  title TEXT,
  content TEXT,
  snippet TEXT,
  content_snippet TEXT,
  author_name TEXT,
  author_username TEXT,
  is_sme_certified BOOLEAN,
  relevance_score REAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  
  -- Search Discussions
  SELECT 
    'Discussion'::TEXT AS result_type,
    d.id AS result_id,
    d.slug AS result_slug,
    d.title,
    d.content,
    NULL::TEXT AS snippet,
    ts_headline('english', d.content, plainto_tsquery('english', search_query), 
      'MaxWords=50, MinWords=25, ShortWord=3, MaxFragments=1') AS content_snippet,
    p.full_name AS author_name,
    p.username AS author_username,
    false AS is_sme_certified,
    ts_rank(
      to_tsvector('english', d.title || ' ' || d.content),
      plainto_tsquery('english', search_query)
    ) AS relevance_score,
    d.created_at
  FROM discussions d
  JOIN profiles p ON d.author_id = p.id
  WHERE 
    (
      to_tsvector('english', d.title || ' ' || d.content) @@ plainto_tsquery('english', search_query)
      OR d.title ILIKE '%' || search_query || '%'
      OR d.content ILIKE '%' || search_query || '%'
    )
    AND (d.is_flagged = false OR d.is_flagged IS NULL)
  
  UNION ALL
  
  -- Search Products
  SELECT 
    'Product'::TEXT AS result_type,
    pr.id AS result_id,
    pr.slug AS result_slug,
    pr.title,
    COALESCE(pr.problem_solved, pr.ai_summary, '') AS content,
    NULL::TEXT AS snippet,
    ts_headline('english', COALESCE(pr.problem_solved, pr.ai_summary, ''), plainto_tsquery('english', search_query),
      'MaxWords=50, MinWords=25, ShortWord=3, MaxFragments=1') AS content_snippet,
    NULL::TEXT AS author_name,
    NULL::TEXT AS author_username,
    COALESCE(pr.is_sme_certified, false) AS is_sme_certified,
    ts_rank(
      to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')),
      plainto_tsquery('english', search_query)
    ) AS relevance_score,
    pr.created_at
  FROM products pr
  WHERE 
    (
      to_tsvector('english', pr.title || ' ' || COALESCE(pr.problem_solved, '') || ' ' || COALESCE(pr.ai_summary, '')) 
      @@ plainto_tsquery('english', search_query)
      OR pr.title ILIKE '%' || search_query || '%'
      OR pr.problem_solved ILIKE '%' || search_query || '%'
      OR pr.ai_summary ILIKE '%' || search_query || '%'
    )
  
  UNION ALL
  
  -- Search Reviews
  SELECT 
    'Review'::TEXT AS result_type,
    r.id AS result_id,
    p.slug AS result_slug,
    p.title AS title,
    r.content AS content,
    NULL::TEXT AS snippet,
    ts_headline('english', r.content, plainto_tsquery('english', search_query),
      'MaxWords=50, MinWords=25, ShortWord=3, MaxFragments=1') AS content_snippet,
    COALESCE(pr.full_name, r.guest_author_name) AS author_name,
    pr.username AS author_username,
    COALESCE(p.is_sme_certified, false) AS is_sme_certified,
    ts_rank(
      to_tsvector('english', r.content),
      plainto_tsquery('english', search_query)
    ) AS relevance_score,
    r.created_at
  FROM reviews r
  JOIN products p ON r.product_id = p.id
  LEFT JOIN profiles pr ON r.user_id = pr.id
  WHERE 
    (
      to_tsvector('english', r.content) @@ plainto_tsquery('english', search_query)
      OR r.content ILIKE '%' || search_query || '%'
    )
    AND (r.is_flagged = false OR r.is_flagged IS NULL)
  
  ORDER BY relevance_score DESC, created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION global_search IS 'Enhanced full-text search across discussions, products, and reviews with fuzzy ILIKE matching and content snippets';
