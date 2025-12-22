-- =====================================================
-- RENAME PROTOCOLS TO PRODUCTS MIGRATION
-- =====================================================
-- Renames the protocols table to products and updates related columns
-- =====================================================

-- 1. Rename the table
ALTER TABLE IF EXISTS protocols RENAME TO products;

-- 2. Rename columns in related tables
ALTER TABLE reviews RENAME COLUMN protocol_id TO product_id;

-- 3. Rename indexes for consistency
ALTER INDEX IF EXISTS idx_protocols_slug RENAME TO idx_products_slug;
ALTER INDEX IF EXISTS idx_protocols_created_at RENAME TO idx_products_created_at;
ALTER INDEX IF EXISTS idx_protocols_images RENAME TO idx_products_images;
ALTER INDEX IF EXISTS idx_protocols_is_sme_certified RENAME TO idx_products_is_sme_certified;
ALTER INDEX IF EXISTS idx_reviews_protocol_id RENAME TO idx_reviews_product_id;

-- 4. Update comments
COMMENT ON TABLE products IS 'Products and supplements with SME certification';
COMMENT ON COLUMN products.images IS 'Array of image URLs (up to 10) stored in product-images bucket';
COMMENT ON COLUMN products.is_sme_certified IS 'Whether the product is SME certified (meets all verification criteria)';
COMMENT ON COLUMN reviews.product_id IS 'Reference to the product being reviewed';
COMMENT ON COLUMN reviews.guest_author_name IS 'Display name for guest reviews (when user_id is null)';

-- 5. Update Global Search Function
-- We need to drop and recreate it to update the 'protocol' literal to 'product'

DROP FUNCTION IF EXISTS global_search(TEXT, INTEGER);

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
    AND d.is_flagged = false
  
  UNION ALL
  
  -- Search Products
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
  
  ORDER BY rank DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION global_search IS 'Full-text search across discussions and products';
