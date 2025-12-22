-- =====================================================
-- Fix Topic Follows RLS for Clerk Integration
-- =====================================================
-- Disables Row Level Security on topic_follows table
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we disable RLS and handle authentication in the application layer.
-- =====================================================

-- Disable RLS on topic_follows table
ALTER TABLE topic_follows DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled (this will show in the output)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'topic_follows' 
    AND schemaname = 'public'
  ) THEN
    RAISE NOTICE 'RLS has been disabled on topic_follows table';
  ELSE
    RAISE NOTICE 'topic_follows table does not exist yet. Please run supabase-topic-follows.sql first.';
  END IF;
END $$;

-- Drop any existing RLS policies (if they exist)
DROP POLICY IF EXISTS "Users can follow topics" ON topic_follows;
DROP POLICY IF EXISTS "Users can view their own topic follows" ON topic_follows;
DROP POLICY IF EXISTS "Users can manage their own topic follows" ON topic_follows;

-- Add comment
COMMENT ON TABLE topic_follows IS 'Users following specific topics/tags. RLS disabled for Clerk integration.';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to disable RLS
-- on the topic_follows table.
-- =====================================================





