ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING GIN (social_links);


