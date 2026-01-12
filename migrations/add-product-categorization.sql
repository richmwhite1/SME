-- =====================================================
-- PRODUCT CATEGORIZATION SYSTEM MIGRATION
-- =====================================================
-- Adds dual-tier categorization with primary categories
-- and secondary category tags (conditions, goals, ingredients, forms)
-- =====================================================

-- Add new categorization columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS primary_category TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS secondary_categories JSONB DEFAULT '{
  "conditions": [],
  "goals": [],
  "ingredients": [],
  "forms": []
}'::jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_primary_category ON products(primary_category);
CREATE INDEX IF NOT EXISTS idx_products_secondary_categories ON products USING GIN(secondary_categories);

-- Add column comments
COMMENT ON COLUMN products.primary_category IS 'Primary category: Foundational Health, Targeted Support, Lifestyle & Performance, or Specialized Needs';
COMMENT ON COLUMN products.secondary_categories IS 'JSONB object with arrays for conditions, goals, ingredients, and forms tags';

-- =====================================================
-- DATA MIGRATION: Map existing categories to new structure
-- =====================================================

-- Sleep → Lifestyle & Performance
UPDATE products 
SET 
  primary_category = 'Lifestyle & Performance',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY['Insomnia']::text[],
    'goals', ARRAY['Better Sleep']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Sleep' AND primary_category IS NULL;

-- Gut Health → Targeted Support
UPDATE products 
SET 
  primary_category = 'Targeted Support',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY['Digestive Issues']::text[],
    'goals', ARRAY['Gut Health']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Gut Health' AND primary_category IS NULL;

-- Performance → Lifestyle & Performance
UPDATE products 
SET 
  primary_category = 'Lifestyle & Performance',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Athletic Performance', 'Energy Boost']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Performance' AND primary_category IS NULL;

-- Brain Fog → Lifestyle & Performance
UPDATE products 
SET 
  primary_category = 'Lifestyle & Performance',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY['Brain Fog']::text[],
    'goals', ARRAY['Mental Clarity', 'Focus & Concentration']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Brain Fog' AND primary_category IS NULL;

-- Vitality → Foundational Health
UPDATE products 
SET 
  primary_category = 'Foundational Health',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Energy Boost', 'Longevity']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Vitality' AND primary_category IS NULL;

-- Hormones → Targeted Support
UPDATE products 
SET 
  primary_category = 'Targeted Support',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY['Hormonal Imbalance']::text[],
    'goals', ARRAY[]::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Hormones' AND primary_category IS NULL;

-- Weight Loss → Lifestyle & Performance
UPDATE products 
SET 
  primary_category = 'Lifestyle & Performance',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Weight Loss']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Weight Loss' AND primary_category IS NULL;

-- Recovery → Lifestyle & Performance
UPDATE products 
SET 
  primary_category = 'Lifestyle & Performance',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Recovery']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Recovery' AND primary_category IS NULL;

-- Detox → Targeted Support
UPDATE products 
SET 
  primary_category = 'Targeted Support',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Detoxification']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Detox' AND primary_category IS NULL;

-- Survivalist → Foundational Health
UPDATE products 
SET 
  primary_category = 'Foundational Health',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY['Immune Support']::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE category = 'Survivalist' AND primary_category IS NULL;

-- Set default for any remaining products without primary_category
UPDATE products 
SET 
  primary_category = 'Foundational Health',
  secondary_categories = jsonb_build_object(
    'conditions', ARRAY[]::text[],
    'goals', ARRAY[]::text[],
    'ingredients', ARRAY[]::text[],
    'forms', ARRAY[]::text[]
  )
WHERE primary_category IS NULL;

-- =====================================================
-- VALIDATION QUERIES (for testing)
-- =====================================================

-- Check migration results
-- SELECT primary_category, category, COUNT(*) 
-- FROM products 
-- GROUP BY primary_category, category 
-- ORDER BY primary_category, category;

-- View secondary categories structure
-- SELECT title, primary_category, secondary_categories 
-- FROM products 
-- LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
