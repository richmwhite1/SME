-- Add new product fields for enhanced AI scraping
-- Run this migration to add price, manufacturer, serving info, warnings, and certifications

ALTER TABLE products ADD COLUMN IF NOT EXISTS price TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS manufacturer TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS serving_info TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warnings TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS certifications TEXT[];

-- Add comments for documentation
COMMENT ON COLUMN products.price IS 'Retail price of the product (e.g., "$29.99")';
COMMENT ON COLUMN products.manufacturer IS 'Brand or company name that manufactures the product';
COMMENT ON COLUMN products.serving_info IS 'Serving size and servings per container information';
COMMENT ON COLUMN products.warnings IS 'Product warnings, contraindications, or safety information';
COMMENT ON COLUMN products.certifications IS 'Array of third-party certifications (NSF, USP, GMP, Organic, etc.)';
