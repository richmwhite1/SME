-- =====================================================
-- Complete Fix for Topic Follows Table
-- =====================================================
-- This script ensures topic_follows table works correctly with Clerk authentication
-- Fixes: RLS, foreign key constraints, and type compatibility
-- =====================================================

-- Step 1: Ensure the table exists with correct schema
CREATE TABLE IF NOT EXISTS topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: User can only follow a topic once
  CONSTRAINT unique_topic_follow UNIQUE (user_id, topic_name)
);

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_follows_user_id ON topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_topic_name ON topic_follows(topic_name);
CREATE INDEX IF NOT EXISTS idx_topic_follows_created_at ON topic_follows(created_at DESC);

-- Step 3: CRITICAL - Disable RLS (Row Level Security)
-- RLS requires Supabase Auth, but we're using Clerk
ALTER TABLE topic_follows DISABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing RLS policies (they won't work with Clerk)
DROP POLICY IF EXISTS "Users can follow topics" ON topic_follows;
DROP POLICY IF EXISTS "Users can view their own topic follows" ON topic_follows;
DROP POLICY IF EXISTS "Users can manage their own topic follows" ON topic_follows;
DROP POLICY IF EXISTS "Authenticated users can insert topic follows" ON topic_follows;
DROP POLICY IF EXISTS "Users can view their own follows" ON topic_follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON topic_follows;

-- Step 5: Verify RLS is disabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = 'topic_follows' 
    AND schemaname = 'public'
  ) THEN
    -- Check if RLS is actually disabled
    IF EXISTS (
      SELECT 1 
      FROM pg_tables 
      WHERE tablename = 'topic_follows' 
      AND schemaname = 'public'
      AND rowsecurity = false
    ) THEN
      RAISE NOTICE '✓ RLS is DISABLED on topic_follows table';
    ELSE
      RAISE WARNING '⚠ RLS might still be enabled - please verify manually';
    END IF;
  ELSE
    RAISE NOTICE '⚠ topic_follows table does not exist yet';
  END IF;
END $$;

-- Step 6: Verify foreign key constraint exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'topic_follows_user_id_fkey'
    AND table_name = 'topic_follows'
  ) THEN
    RAISE NOTICE '✓ Foreign key constraint exists: topic_follows_user_id_fkey';
  ELSE
    RAISE WARNING '⚠ Foreign key constraint missing - adding it now';
    ALTER TABLE topic_follows 
    ADD CONSTRAINT topic_follows_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 7: Add comments
COMMENT ON TABLE topic_follows IS 'Users following specific topics/tags. RLS disabled for Clerk integration.';
COMMENT ON COLUMN topic_follows.user_id IS 'Clerk user ID (TEXT type to match Clerk string IDs)';
COMMENT ON COLUMN topic_follows.topic_name IS 'The topic/tag name (e.g., Biohacking, Longevity)';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the fix:

-- 1. Check RLS status:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename = 'topic_follows';

-- 2. Check policies (should return 0 rows):
-- SELECT * FROM pg_policies WHERE tablename = 'topic_follows';

-- 3. Check foreign key:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name 
-- FROM information_schema.table_constraints AS tc 
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY' 
--   AND tc.table_name = 'topic_follows';

-- =====================================================
-- COMPLETE
-- =====================================================
-- After running this script:
-- 1. The topic_follows table will have RLS disabled
-- 2. All RLS policies will be removed
-- 3. Foreign key constraint will be verified/created
-- 4. The table will work correctly with Clerk authentication
-- =====================================================


