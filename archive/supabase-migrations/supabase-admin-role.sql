-- =====================================================
-- Admin Role Support
-- =====================================================
-- Adds is_admin column to profiles table for admin access control
-- =====================================================

-- Add is_admin column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for efficient admin checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Add comment
COMMENT ON COLUMN profiles.is_admin IS 'Whether the user has admin/moderator privileges';

-- =====================================================
-- Optional: Grant admin role to your user
-- =====================================================
-- Replace 'your-clerk-user-id' with your actual Clerk user ID
-- You can find this in your Clerk dashboard or by checking the current user in your app

-- Example (UNCOMMENT AND REPLACE THE ID):
-- UPDATE profiles SET is_admin = true WHERE id = 'your-clerk-user-id';

-- =====================================================
-- COMPLETE
-- =====================================================
-- After running this:
-- 1. Update at least one user to is_admin = true (use the example above)
-- 2. That user will be able to access /admin/moderation
-- =====================================================


