-- =====================================================
-- Fix Admin Access for Product Creation
-- =====================================================
-- This script fixes two issues:
-- 1. Disables RLS on protocols table (Clerk doesn't work with RLS)
-- 2. Sets your user as admin in the profiles table
-- =====================================================

-- Step 1: Disable RLS on protocols table
ALTER TABLE protocols DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Admins can insert products" ON protocols;
DROP POLICY IF EXISTS "Admins can update products" ON protocols;
DROP POLICY IF EXISTS "Admins can delete products" ON protocols;
DROP POLICY IF EXISTS "Public can read products" ON protocols;

-- Step 2: Ensure is_admin column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Step 3: Set your user as admin
-- IMPORTANT: Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
-- To find your Clerk user ID:
--   1. Open browser console when logged in
--   2. Type: window.Clerk?.user?.id
--   3. Or check Clerk Dashboard > Users > Your User > User ID
UPDATE profiles 
SET is_admin = true 
WHERE id = 'YOUR_CLERK_USER_ID';

-- Verify the update
SELECT id, full_name, username, is_admin 
FROM profiles 
WHERE id = 'YOUR_CLERK_USER_ID';

-- =====================================================
-- COMPLETE
-- =====================================================
-- 1. Replace 'YOUR_CLERK_USER_ID' with your actual Clerk user ID
-- 2. Run this SQL in Supabase SQL Editor
-- 3. Try creating a product again - it should work now!
-- =====================================================





