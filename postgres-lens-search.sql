-- Add score columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'score_scientific') THEN
        ALTER TABLE products ADD COLUMN score_scientific INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'score_alternative') THEN
        ALTER TABLE products ADD COLUMN score_alternative INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'score_esoteric') THEN
        ALTER TABLE products ADD COLUMN score_esoteric INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create or Replace Function
CREATE OR REPLACE FUNCTION search_products_by_lens(
  p_search_query TEXT,
  p_lens TEXT
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  problem_solved TEXT,
  images TEXT[],
  score_scientific INTEGER,
  score_alternative INTEGER,
  score_esoteric INTEGER,
  is_sme_certified BOOLEAN,
  third_party_lab_verified BOOLEAN,
  source_transparency BOOLEAN,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.title,
    p.slug,
    p.problem_solved,
    p.images,
    COALESCE(p.score_scientific, 0) as score_scientific,
    COALESCE(p.score_alternative, 0) as score_alternative,
    COALESCE(p.score_esoteric, 0) as score_esoteric,
    p.is_sme_certified,
    p.third_party_lab_verified,
    p.source_transparency,
    ts_rank(
      to_tsvector('english', p.title || ' ' || COALESCE(p.problem_solved, '')),
      plainto_tsquery('english', p_search_query)
    ) AS rank
  FROM products p
  WHERE
    (p_search_query = '' OR to_tsvector('english', p.title || ' ' || COALESCE(p.problem_solved, '')) @@ plainto_tsquery('english', p_search_query))
  ORDER BY
    CASE WHEN p_lens = 'scientific' THEN COALESCE(p.score_scientific, 0)
         WHEN p_lens = 'ancestral' THEN COALESCE(p.score_alternative, 0)
         WHEN p_lens = 'esoteric' THEN COALESCE(p.score_esoteric, 0)
         ELSE 0
    END DESC,
    rank DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;
