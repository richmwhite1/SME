-- =====================================================
-- Disable RLS for Clerk Integration
-- =====================================================
-- If you're using Clerk for authentication (not Supabase Auth),
-- you'll need to disable RLS on these tables and handle
-- authentication in your application layer instead.
-- =====================================================

-- Disable RLS on follows table
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- Disable RLS on discussions table
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

-- Note: You may also want to disable RLS on profiles and reviews
-- if you haven't already:
-- ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;


