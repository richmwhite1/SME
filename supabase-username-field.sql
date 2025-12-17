-- =====================================================
-- Add Username Field to Profiles
-- =====================================================
-- Adds username column for public profile URLs
-- =====================================================

-- Add username column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for username (enforces uniqueness)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username) WHERE username IS NOT NULL;

-- Create index for efficient username lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lookup ON profiles(username);

-- Add comment
COMMENT ON COLUMN profiles.username IS 'Unique username for public profile URLs (e.g., /u/username)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to enable
-- username-based profile URLs.
-- =====================================================


