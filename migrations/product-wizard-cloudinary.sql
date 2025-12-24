-- =====================================================
-- Product Wizard with Cloudinary Integration
-- =====================================================
-- Adds fields for 3-step wizard: Narrative, Media, Technical Specs
-- =====================================================

-- Add company blurb (rich text for mission & story)
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_blurb TEXT;

-- Add product photos array (Cloudinary URLs, max 10)
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_photos JSONB DEFAULT '[]'::jsonb;

-- Add YouTube link (validated URL)
ALTER TABLE products ADD COLUMN IF NOT EXISTS youtube_link TEXT;

-- Add technical documentation links array (up to 10 URLs)
ALTER TABLE products ADD COLUMN IF NOT EXISTS tech_docs JSONB DEFAULT '[]'::jsonb;

-- Add technical specifications (key-value pairs)
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;

-- Add brand column if it doesn't exist (for company name)
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;

-- Add category column if it doesn't exist (for product category)
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT;

-- Add name column if it doesn't exist (for product name)
ALTER TABLE products ADD COLUMN IF NOT EXISTS name TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_product_photos ON products USING GIN(product_photos);
CREATE INDEX IF NOT EXISTS idx_products_technical_specs ON products USING GIN(technical_specs);

-- Add comments
COMMENT ON COLUMN products.company_blurb IS 'Rich-text mission and story from the vendor';
COMMENT ON COLUMN products.product_photos IS 'Array of Cloudinary photo URLs (max 10), auto-resized to 1200px width';
COMMENT ON COLUMN products.youtube_link IS 'YouTube or youtu.be video link';
COMMENT ON COLUMN products.technical_specs IS 'Key-value pairs for technical specifications (e.g., {"Weight": "2kg", "Material": "Carbon Fiber"})';
COMMENT ON COLUMN products.brand IS 'Brand or manufacturer name';
COMMENT ON COLUMN products.category IS 'Primary product category';
COMMENT ON COLUMN products.name IS 'Product name';

-- =====================================================
-- COMPLETE
-- =====================================================
