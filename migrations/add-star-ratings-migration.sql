-- =====================================================
-- STAR RATING SYSTEM MIGRATION
-- =====================================================
-- Adds 5-star rating capability to product comments
-- with reputation-weighted aggregate calculations
-- =====================================================

-- 1. Add star_rating column to product_comments table
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS star_rating INTEGER DEFAULT NULL
CHECK (star_rating IS NULL OR (star_rating >= 1 AND star_rating <= 5));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_product_comments_star_rating 
ON product_comments(star_rating) 
WHERE star_rating IS NOT NULL;

COMMENT ON COLUMN product_comments.star_rating IS 'Optional 1-5 star rating for the product (NULL if not provided)';

-- 2. Add aggregate rating columns to products table
ALTER TABLE products
ADD COLUMN IF NOT EXISTS aggregate_star_rating DECIMAL(3,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_star_reviews INTEGER DEFAULT 0;

-- Create index for sorting/filtering by rating
CREATE INDEX IF NOT EXISTS idx_products_aggregate_star_rating 
ON products(aggregate_star_rating DESC NULLS LAST);

COMMENT ON COLUMN products.aggregate_star_rating IS 'Weighted average star rating (1.00-5.00) based on user reputation scores';
COMMENT ON COLUMN products.total_star_reviews IS 'Total number of reviews with star ratings';

-- 3. Create function to calculate reputation-weighted star average
CREATE OR REPLACE FUNCTION calculate_weighted_star_average(product_id_param UUID)
RETURNS TABLE(
  weighted_average DECIMAL(3,2),
  review_count INTEGER
) AS $$
DECLARE
  total_weighted_sum DECIMAL := 0;
  total_weight DECIMAL := 0;
  review_count_result INTEGER := 0;
  weighted_avg DECIMAL(3,2);
BEGIN
  -- Calculate weighted sum and total weight
  -- Weight = (reputation_score + 1) to ensure all users have at least weight of 1
  SELECT 
    COALESCE(SUM(pc.star_rating * (COALESCE(p.reputation_score, 0) + 1)), 0),
    COALESCE(SUM(COALESCE(p.reputation_score, 0) + 1), 0),
    COUNT(*)
  INTO total_weighted_sum, total_weight, review_count_result
  FROM product_comments pc
  LEFT JOIN profiles p ON pc.author_id = p.id
  WHERE pc.product_id = product_id_param
    AND pc.star_rating IS NOT NULL
    AND (pc.is_flagged IS FALSE OR pc.is_flagged IS NULL);
  
  -- Calculate weighted average (avoid division by zero)
  IF total_weight > 0 THEN
    weighted_avg := ROUND((total_weighted_sum / total_weight)::NUMERIC, 2);
  ELSE
    weighted_avg := NULL;
  END IF;
  
  -- Return results
  RETURN QUERY SELECT weighted_avg, review_count_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_weighted_star_average IS 'Calculate reputation-weighted average star rating for a product';

-- 4. Create function to update product aggregate rating
CREATE OR REPLACE FUNCTION update_product_star_aggregate(product_id_param UUID)
RETURNS VOID AS $$
DECLARE
  avg_rating DECIMAL(3,2);
  num_reviews INTEGER;
BEGIN
  -- Calculate weighted average
  SELECT weighted_average, review_count 
  INTO avg_rating, num_reviews
  FROM calculate_weighted_star_average(product_id_param);
  
  -- Update products table
  UPDATE products
  SET 
    aggregate_star_rating = avg_rating,
    total_star_reviews = num_reviews,
    updated_at = NOW()
  WHERE id = product_id_param;
  
  RAISE NOTICE 'Updated product % aggregate rating: % (% reviews)', 
    product_id_param, avg_rating, num_reviews;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_product_star_aggregate IS 'Update cached aggregate star rating for a product';

-- 5. Create trigger to auto-update aggregate when comments change
CREATE OR REPLACE FUNCTION trigger_update_product_star_aggregate()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id UUID;
  should_update BOOLEAN := false;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
    should_update := (OLD.star_rating IS NOT NULL);
  ELSIF TG_OP = 'INSERT' THEN
    target_product_id := NEW.product_id;
    should_update := (NEW.star_rating IS NOT NULL);
  ELSE -- UPDATE
    target_product_id := NEW.product_id;
    should_update := (OLD.star_rating IS DISTINCT FROM NEW.star_rating);
  END IF;
  
  -- Only update if star rating was involved
  IF should_update THEN
    PERFORM update_product_star_aggregate(target_product_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to product_comments table
DROP TRIGGER IF EXISTS trigger_update_star_aggregate_on_comment ON product_comments;
CREATE TRIGGER trigger_update_star_aggregate_on_comment
  AFTER INSERT OR UPDATE OF star_rating OR DELETE ON product_comments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_product_star_aggregate();

COMMENT ON TRIGGER trigger_update_star_aggregate_on_comment ON product_comments IS 'Automatically update product aggregate rating when star ratings change';

-- 6. Initialize aggregate ratings for existing products
-- This will calculate ratings for any products that already have comments with ratings
DO $$
DECLARE
  product_record RECORD;
BEGIN
  FOR product_record IN 
    SELECT DISTINCT product_id 
    FROM product_comments 
    WHERE star_rating IS NOT NULL
  LOOP
    PERFORM update_product_star_aggregate(product_record.product_id);
  END LOOP;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Star rating system is now active:
-- - Users can optionally rate products 1-5 stars
-- - Ratings are weighted by user reputation_score
-- - Aggregate ratings auto-update via triggers
-- - Products table caches aggregate for performance
-- =====================================================
