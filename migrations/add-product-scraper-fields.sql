-- Add product scraper fields for unclaimed product feature
-- Adds description, ingredients (JSONB), brand_name, and status columns
-- Run this migration to enable admin product scraping functionality

-- Add description column for product descriptions
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;

-- Add ingredients column as JSONB for structured ingredient data
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients JSONB;

-- Add brand_name column for manufacturer/brand name
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_name TEXT;

-- Add status column to track product claim status
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'unclaimed';

-- Add check constraint for valid status values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_product_status') THEN
        ALTER TABLE products ADD CONSTRAINT check_product_status 
        CHECK (status IN ('unclaimed', 'claimed', 'verified'));
    END IF;
END $$;

-- Ensure slug has unique index for duplicate detection (should already exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug);

-- Add index on status for filtering unclaimed products
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Add comments for documentation
COMMENT ON COLUMN products.description IS 'Product description extracted from scraping or manual entry';
COMMENT ON COLUMN products.ingredients IS 'Structured ingredient list as JSONB array';
COMMENT ON COLUMN products.brand_name IS 'Brand or manufacturer name';
COMMENT ON COLUMN products.status IS 'Product claim status: unclaimed (scraped), claimed (brand verified), verified (SME certified)';
