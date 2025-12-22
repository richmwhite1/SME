-- =====================================================
-- Add Social Links to Profiles
-- =====================================================
-- Adds social_links JSONB column for Discord, Telegram, X, Instagram
-- =====================================================

-- Add social_links JSONB column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb;

-- Create index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_social_links ON profiles USING GIN (social_links);

-- Add comment
COMMENT ON COLUMN profiles.social_links IS 'Social media links stored as JSONB: {discord, telegram, x, instagram}';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to enable
-- social media links in profiles.
-- =====================================================


