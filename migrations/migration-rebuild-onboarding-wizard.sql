-- Migration: Rebuild Product Onboarding Wizard
-- Add comprehensive fields for the new 3-step wizard flow

-- Step 1: Marketing & Core
ALTER TABLE products ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS company_blurb TEXT;

-- Step 2: Visuals & Media
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_photos TEXT[] DEFAULT '{}';
-- video_url already exists, repurposing for YouTube/video links
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_docs_url TEXT;

-- Step 3: SME Assessment Prep
ALTER TABLE products ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS core_value_proposition TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS technical_specs JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sme_access_note TEXT;

-- Add comments for documentation
COMMENT ON COLUMN products.tagline IS 'Quick product hook, max 100 characters (validated in app)';
COMMENT ON COLUMN products.company_blurb IS 'Brand story and product mission for SME context';
COMMENT ON COLUMN products.product_photos IS 'Array of image URLs for product photos';
COMMENT ON COLUMN products.technical_docs_url IS 'Link to manuals, whitepapers, or API documentation';
COMMENT ON COLUMN products.target_audience IS 'Target user demographic/persona';
COMMENT ON COLUMN products.core_value_proposition IS 'Primary problem this product solves';
COMMENT ON COLUMN products.technical_specs IS 'Key-value pairs for technical specifications';
COMMENT ON COLUMN products.sme_access_note IS 'Instructions for expert reviewers';
