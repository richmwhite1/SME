-- Enable pgcrypto extension if not already enabled (usually good practice)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- Semantic Search RPC Function
-- =====================================================
-- Uses websearch_to_tsquery for natural language search
-- Supports filtering by mode: 'verified' (products), 'community' (discussions), 'holistic' (both)
-- =====================================================

-- Drop function first to allow return type change
DROP FUNCTION IF EXISTS search_products_semantic(text, text, integer);

CREATE OR REPLACE FUNCTION search_products_semantic(
  query_text TEXT,
  filter_mode TEXT DEFAULT 'holistic',
  result_limit INTEGER DEFAULT 20
)
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
  score_scientific INTEGER,
  score_alternative INTEGER,
  score_esoteric INTEGER,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH search_query AS (
    SELECT websearch_to_tsquery('english', query_text) AS query
  ),
  product_results AS (
    SELECT
      'Product'::TEXT AS result_type,
      p.id::TEXT AS result_id,
      p.slug AS result_slug,
      p.title,
      COALESCE(p.problem_solved, '') AS content,
      ts_headline('english', COALESCE(p.problem_solved, '') || ' ' || COALESCE(p.ai_summary, ''), sq.query) AS snippet,
      p.created_at,
      COALESCE(prof.full_name, 'Unknown') AS author_name,
      prof.username AS author_username,
      COALESCE(p.is_sme_certified, false) AS is_sme_certified,
      COALESCE(p.score_scientific, 0) AS score_scientific,
      COALESCE(p.score_alternative, 0) AS score_alternative,
      COALESCE(p.score_esoteric, 0) AS score_esoteric,
      (ts_rank(to_tsvector('english', p.title || ' ' || COALESCE(p.problem_solved, '') || ' ' || COALESCE(p.ai_summary, '')), sq.query) * 
       CASE WHEN p.is_sme_certified THEN 1.5 ELSE 1.0 END) AS relevance_score
    FROM products p
    CROSS JOIN search_query sq
    LEFT JOIN profiles prof ON p.created_by = prof.id
    WHERE (
      (filter_mode = 'verified' OR filter_mode = 'holistic')
      AND (
        to_tsvector('english', p.title || ' ' || COALESCE(p.problem_solved, '') || ' ' || COALESCE(p.ai_summary, '')) @@ sq.query
      )
      AND COALESCE(p.is_flagged, false) = false
    )
  ),
  discussion_results AS (
    SELECT
      'Discussion'::TEXT AS result_type,
      d.id::TEXT AS result_id,
      d.slug AS result_slug,
      d.title,
      d.content,
      ts_headline('english', d.content, sq.query) AS snippet,
      d.created_at,
      COALESCE(prof.full_name, 'Anonymous') AS author_name,
      prof.username AS author_username,
      false AS is_sme_certified,
      0 AS score_scientific,
      0 AS score_alternative,
      0 AS score_esoteric,
      ts_rank(to_tsvector('english', d.title || ' ' || d.content), sq.query) AS relevance_score
    FROM discussions d
    CROSS JOIN search_query sq
    LEFT JOIN profiles prof ON d.author_id = prof.id
    WHERE (
      (filter_mode = 'community' OR filter_mode = 'holistic')
      AND (
        to_tsvector('english', d.title || ' ' || d.content) @@ sq.query
      )
      AND COALESCE(d.is_flagged, false) = false
    )
  ),
  review_results AS (
    SELECT
      'Review'::TEXT AS result_type,
      r.id::TEXT AS result_id,
      p.slug AS result_slug,
      'Review for ' || p.title AS title,
      r.content,
      ts_headline('english', r.content, sq.query) AS snippet,
      r.created_at,
      COALESCE(r.guest_author_name, prof.full_name, 'Anonymous') AS author_name,
      prof.username AS author_username,
      false AS is_sme_certified,
      0 AS score_scientific,
      0 AS score_alternative,
      0 AS score_esoteric,
      ts_rank(to_tsvector('english', r.content), sq.query) AS relevance_score
    FROM reviews r
    CROSS JOIN search_query sq
    JOIN products p ON r.product_id = p.id
    LEFT JOIN profiles prof ON r.user_id = prof.id
    WHERE (
      (filter_mode = 'community' OR filter_mode = 'holistic')
      AND (
        to_tsvector('english', r.content) @@ sq.query
      )
      AND COALESCE(r.is_flagged, false) = false
    )
  ),
  all_results AS (
    SELECT * FROM product_results
    UNION ALL
    SELECT * FROM discussion_results
    UNION ALL
    SELECT * FROM review_results
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
    ar.score_scientific,
    ar.score_alternative,
    ar.score_esoteric,
    ar.relevance_score
  FROM all_results ar
  ORDER BY ar.relevance_score DESC, ar.created_at DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION search_products_semantic IS 'Semantic search using websearch_to_tsquery across products and discussions with filtering.';
