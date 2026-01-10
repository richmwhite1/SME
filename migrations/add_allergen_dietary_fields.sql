-- Add allergens and dietary_tags columns to products table
-- Migration: add_allergen_dietary_fields
-- Created: 2026-01-10

-- Add allergens column (JSONB array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS allergens JSONB DEFAULT '[]'::jsonb;

-- Add dietary_tags column (JSONB array)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS dietary_tags JSONB DEFAULT '[]'::jsonb;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_products_allergens ON products USING GIN (allergens);
CREATE INDEX IF NOT EXISTS idx_products_dietary_tags ON products USING GIN (dietary_tags);

-- Add comment for documentation
COMMENT ON COLUMN products.allergens IS 'Array of allergen warnings: dairy, eggs, fish, shellfish, tree_nuts, peanuts, wheat, soy, gluten, none';
COMMENT ON COLUMN products.dietary_tags IS 'Array of dietary compliance tags: vegan, vegetarian, gluten_free, dairy_free, kosher, halal, paleo, keto, non_gmo';
