-- Add new columns for Product Onboarding Wizard
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT; -- Maps to "Job Function"
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT; -- Founder/Explanation Video
ALTER TABLE products ADD COLUMN IF NOT EXISTS ingredients TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS citation_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sme_signals JSONB DEFAULT '{}'::jsonb; -- Stores signal justifications
ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_status TEXT DEFAULT 'pending_review';

-- Optional: Create an index on admin_status if we plan to filter by it often
CREATE INDEX IF NOT EXISTS idx_products_admin_status ON products(admin_status);
