-- =====================================================
-- Add Profession Column to Profiles Table
-- =====================================================
-- Adds profession field for user's professional title/role
-- =====================================================

-- Add profession column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profession IS 'User profession or professional title (e.g., Neuroscientist, Nutritionist, Researcher)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to enable
-- profession field in profiles.
-- =====================================================


