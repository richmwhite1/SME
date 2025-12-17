-- =====================================================
-- Add Missing Profile Columns
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- missing columns to the profiles table
-- =====================================================

-- Add website_url column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Add credentials column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS credentials TEXT;

-- Add bio column (if missing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- =====================================================
-- COMPLETE
-- =====================================================
-- After running this, your profile update should work
-- =====================================================


