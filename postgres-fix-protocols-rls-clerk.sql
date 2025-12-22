-- =====================================================
-- Fix Protocols RLS for Clerk Integration
-- =====================================================
-- Disables Row Level Security on protocols table
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we disable RLS and handle authentication in the application layer.
-- =====================================================

-- Disable RLS on protocols table
ALTER TABLE protocols DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies (if they exist)
DROP POLICY IF EXISTS "Admins can insert products" ON protocols;
DROP POLICY IF EXISTS "Admins can update products" ON protocols;
DROP POLICY IF EXISTS "Admins can delete products" ON protocols;
DROP POLICY IF EXISTS "Public can read products" ON protocols;

-- Verify RLS is disabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'protocols' 
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'RLS has been disabled on protocols table';
  ELSE
    RAISE NOTICE 'protocols table does not exist';
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE protocols IS 'Product protocols. RLS disabled for Clerk integration. Authentication handled in application layer.';

-- =====================================================
-- IMPORTANT: Also Set Your User as Admin
-- =====================================================
-- Run this to set yourself as admin (replace YOUR_CLERK_USER_ID):
-- UPDATE profiles SET is_admin = true WHERE id = 'YOUR_CLERK_USER_ID';
--
-- To find your Clerk user ID:
-- 1. Open browser console when logged in
-- 2. Type: window.Clerk?.user?.id
-- 3. Or check Clerk Dashboard > Users
-- =====================================================

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to disable RLS
-- on the protocols table.
-- Then set your user as admin using the UPDATE statement above.
-- =====================================================





