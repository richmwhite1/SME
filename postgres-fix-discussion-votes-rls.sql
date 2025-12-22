-- =====================================================
-- Fix RLS for Discussion Votes Table (Clerk Integration)
-- =====================================================
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we need to disable RLS on the discussion_votes table and handle
-- authentication in the application layer instead.
-- =====================================================

-- Disable RLS on discussion_votes table
ALTER TABLE discussion_votes DISABLE ROW LEVEL SECURITY;

-- Note: Authentication is handled in the application layer using Clerk's currentUser()
-- The server actions already check for authentication before allowing inserts/updates.

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix the RLS issue
-- for discussion_votes when using Clerk authentication.
-- =====================================================

