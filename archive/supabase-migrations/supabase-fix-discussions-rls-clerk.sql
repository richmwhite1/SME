-- =====================================================
-- Fix RLS for Discussions Table (Clerk Integration)
-- =====================================================
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we need to disable RLS on the discussions table and handle
-- authentication in the application layer instead.
-- =====================================================

-- Disable RLS on discussions table
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

-- Note: Authentication is handled in the application layer using Clerk's currentUser()
-- The server actions already check for authentication before allowing inserts/updates.

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix the RLS issue
-- for discussions when using Clerk authentication.
--
-- NOTE: If you create the discussion_comments table later, you'll also need to
-- disable RLS on it: ALTER TABLE discussion_comments DISABLE ROW LEVEL SECURITY;
-- =====================================================

