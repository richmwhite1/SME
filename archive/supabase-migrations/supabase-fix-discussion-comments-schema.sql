-- =====================================================
-- Fix Discussion Comments Schema
-- =====================================================
-- Updates discussion_comments table to use TEXT for author_id
-- to match Clerk user IDs (not UUID)
-- =====================================================

-- Step 1: Drop all RLS policies (they depend on the column)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'discussion_comments') LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON discussion_comments', r.policyname);
  END LOOP;
END $$;

-- Step 2: Disable RLS temporarily
ALTER TABLE discussion_comments DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop foreign key constraint if it exists
ALTER TABLE discussion_comments DROP CONSTRAINT IF EXISTS discussion_comments_author_id_fkey;

-- Step 4: Alter column type from UUID to TEXT
ALTER TABLE discussion_comments ALTER COLUMN author_id TYPE TEXT USING author_id::TEXT;

-- Step 5: Re-add foreign key constraint with TEXT type
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    BEGIN
      ALTER TABLE discussion_comments
        ADD CONSTRAINT discussion_comments_author_id_fkey
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key to profiles table: %', SQLERRM;
    END;
  END IF;
END $$;

-- Step 6: Ensure flag_count and is_flagged columns exist
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Step 7: Recreate indexes if needed
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_id ON discussion_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON discussion_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_is_flagged ON discussion_comments(is_flagged) WHERE is_flagged = true;

-- Step 8: Ensure RLS stays disabled (we use Clerk, not Supabase Auth)
ALTER TABLE discussion_comments DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE discussion_comments IS 'Comments on discussions';
COMMENT ON COLUMN discussion_comments.flag_count IS 'Number of times this comment has been flagged';
COMMENT ON COLUMN discussion_comments.is_flagged IS 'Whether this comment is hidden due to flagging (3+ flags)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to fix
-- the discussion_comments table schema.
-- =====================================================
