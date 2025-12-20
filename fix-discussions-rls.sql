-- =====================================================
-- Emergency Fix: Disable RLS on discussions table for Clerk
-- =====================================================
-- This fixes the 500 error when creating discussions
-- =====================================================

-- Disable RLS on discussions table
ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;

-- Verify the change
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'discussions';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this in your Supabase SQL Editor immediately
-- =====================================================


