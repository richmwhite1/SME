-- Add pillar_expertise field to profiles table for tracking SME expertise in 9-Pillar categories

-- Add pillar_expertise column (array of pillar names user has expertise in)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS pillar_expertise JSONB DEFAULT '[]'::jsonb;

-- Create GIN index for efficient pillar filtering using array overlap
CREATE INDEX IF NOT EXISTS idx_profiles_pillar_expertise ON profiles USING GIN (pillar_expertise);

-- Add comment documenting the field
COMMENT ON COLUMN profiles.pillar_expertise IS 'Array of 9-Pillar categories where user has declared or demonstrated expertise: Purity, Bioavailability, Potency, Evidence, Sustainability, Experience, Safety, Transparency, Synergy';
