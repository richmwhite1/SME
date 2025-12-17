-- =====================================================
-- Add Username Field to Profiles
-- =====================================================
-- Copy and paste ONLY this SQL into Supabase SQL Editor
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup ON profiles(username);

-- =====================================================
-- Done! You should see "Success. No rows returned"
-- =====================================================


