-- Add Chakra Level and SME Score fields to profiles table

-- Add chakra_level if it doesn't exist (1-7 scale)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS chakra_level INTEGER DEFAULT 1 CHECK (chakra_level BETWEEN 1 AND 7);

-- Add sme_score if it doesn't exist (decimal precision for granular calculations)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sme_score DECIMAL(10, 2) DEFAULT 0.00;

-- Add sme_score_details for storing breakdown JSON
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS sme_score_details JSONB DEFAULT '{}'::jsonb;

-- Add last_score_update timestamp
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_score_update TIMESTAMPTZ DEFAULT NOW();

-- Create index for sorting by score/level
CREATE INDEX IF NOT EXISTS idx_profiles_chakra_level ON profiles(chakra_level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_sme_score ON profiles(sme_score DESC);

-- Migrate existing contributor_score to sme_score if sme_score is 0 and contributor_score > 0
UPDATE profiles 
SET sme_score = contributor_score 
WHERE sme_score = 0 AND contributor_score > 0;

COMMENT ON COLUMN profiles.chakra_level IS 'Current Chakra Level (1-7) representing SME status';
COMMENT ON COLUMN profiles.sme_score IS 'Granular SME score calculated from contributions and weighting';
COMMENT ON COLUMN profiles.sme_score_details IS 'Detailed breakdown of how the score was calculated';
