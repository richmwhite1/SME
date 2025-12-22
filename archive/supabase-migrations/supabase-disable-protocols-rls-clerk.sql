-- =====================================================
-- Disable RLS on Protocols Table for Clerk Integration
-- =====================================================
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we need to disable RLS on protocols table to allow public read access.
-- Authentication checks are handled in the application layer.
-- =====================================================

-- Disable RLS on protocols table
ALTER TABLE protocols DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to disable RLS
-- on the protocols table, allowing public read access
-- while using Clerk for authentication.
-- =====================================================




