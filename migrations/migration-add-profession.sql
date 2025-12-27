-- =====================================================
-- MIGRATION: Add profession column to profiles table
-- =====================================================
-- Date: 2025-12-26
-- Purpose: Fix missing profession column that causes profile update errors
-- =====================================================

-- Add profession column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.profession IS 'User profession or role (e.g., Neuroscientist, Nutritionist, Researcher)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' AND column_name = 'profession';
