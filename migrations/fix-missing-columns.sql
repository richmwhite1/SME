-- Fix missing columns identified during smoke test
-- These columns were referenced in code but missing from the schema

-- 1. SME Certification Flag
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sme_certified BOOLEAN DEFAULT false;

-- 2. Community & Pillar Scores
ALTER TABLE products ADD COLUMN IF NOT EXISTS community_consensus_score INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_scientific INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_alternative INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS score_esoteric INTEGER DEFAULT 0;

-- 3. Ensure YouTube Link column exists (mapped from video_url)
ALTER TABLE products ADD COLUMN IF NOT EXISTS youtube_link TEXT;

COMMENT ON COLUMN products.is_sme_certified IS 'Official SME Verified status';
COMMENT ON COLUMN products.community_consensus_score IS 'Aggregate score from community interaction';
