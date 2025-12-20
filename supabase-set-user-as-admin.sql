-- =====================================================
-- Set User as Admin in Profiles Table
-- =====================================================
-- Updates the profiles table to set is_admin = true for a specific user
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
-- =====================================================

-- First, check if is_admin column exists, if not add it
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Update your user to be admin
-- Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
-- You can find your Clerk user ID in the Clerk Dashboard or in the browser console
-- when logged in: window.Clerk?.user?.id
UPDATE profiles 
SET is_admin = true 
WHERE id = 'YOUR_CLERK_USER_ID';

-- Verify the update
SELECT id, full_name, username, is_admin 
FROM profiles 
WHERE id = 'YOUR_CLERK_USER_ID';

-- =====================================================
-- ALTERNATIVE: Set admin based on Clerk publicMetadata
-- =====================================================
-- If you've set role: 'admin' in Clerk publicMetadata, you can also
-- update all users with that role (if you sync it to profiles):
-- UPDATE profiles SET is_admin = true WHERE id IN (
--   SELECT id FROM profiles WHERE ... -- your Clerk user IDs
-- );

-- =====================================================
-- COMPLETE
-- =====================================================
-- 1. Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
-- 2. Run this SQL in Supabase SQL Editor
-- 3. Verify the update worked
-- =====================================================





