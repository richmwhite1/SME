-- =====================================================
-- Add is_brand_rep column to profiles table
-- =====================================================
-- Migration: Add brand rep status tracking to user profiles
-- This allows Clerk webhook to sync publicMetadata.isBrandRep
-- =====================================================

-- Add is_brand_rep column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_brand_rep BOOLEAN DEFAULT false;

-- Create index for performance when filtering brand reps
CREATE INDEX IF NOT EXISTS idx_profiles_is_brand_rep ON profiles(is_brand_rep) WHERE is_brand_rep = true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.is_brand_rep IS 'Whether the user is a brand representative (synced from Clerk publicMetadata)';

-- =====================================================
-- Migration Complete
-- =====================================================
