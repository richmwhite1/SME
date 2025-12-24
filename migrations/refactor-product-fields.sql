-- Refactor product fields for onboarding wizard requirements
-- Add founder_video_url column (video_url doesn't exist in current schema)
-- Ensure all optional fields are properly nullable

-- Add founder_video_url column if it doesn't exist
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS founder_video_url TEXT;

-- Ensure ingredients column exists and is nullable (optional field)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS ingredients TEXT;

-- Ensure certification_vault_urls exists as JSONB array (optional field)
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS certification_vault_urls JSONB DEFAULT '[]'::jsonb;

-- Ensure admin_status has proper default
ALTER TABLE products 
  ALTER COLUMN admin_status SET DEFAULT 'pending_review';

-- Add comment for documentation
COMMENT ON COLUMN products.founder_video_url IS 'Optional YouTube URL for founder intent/explanation video';
COMMENT ON COLUMN products.ingredients IS 'Optional list of primary active ingredients';
COMMENT ON COLUMN products.certification_vault_urls IS 'Optional array of certification document URLs';
