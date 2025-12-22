-- =====================================================
-- Discussion Votes & Upvote System
-- =====================================================
-- Creates discussion_votes table and adds upvote_count column
-- =====================================================

-- 1. Create discussion_votes table
CREATE TABLE IF NOT EXISTS discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per discussion
  CONSTRAINT unique_user_discussion_vote UNIQUE (user_id, discussion_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_votes_user_id ON discussion_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_discussion_id ON discussion_votes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_votes_created_at ON discussion_votes(created_at DESC);

-- 2. Add upvote_count column to discussions table (for caching)
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Create index for sorting by popularity
CREATE INDEX IF NOT EXISTS idx_discussions_upvote_count ON discussions(upvote_count DESC);

-- 3. Disable RLS (using Clerk for authentication)
ALTER TABLE discussion_votes DISABLE ROW LEVEL SECURITY;

-- 4. Create function to toggle vote and update count atomically
CREATE OR REPLACE FUNCTION toggle_discussion_vote(
  p_user_id TEXT,
  p_discussion_id UUID
)
RETURNS TABLE(
  voted BOOLEAN,
  new_count INTEGER
) AS $$
DECLARE
  v_exists BOOLEAN;
  v_new_count INTEGER;
BEGIN
  -- Check if vote already exists
  SELECT EXISTS(
    SELECT 1 FROM discussion_votes
    WHERE user_id = p_user_id AND discussion_id = p_discussion_id
  ) INTO v_exists;

  IF v_exists THEN
    -- Remove vote
    DELETE FROM discussion_votes
    WHERE user_id = p_user_id AND discussion_id = p_discussion_id;
    
    -- Decrement count
    UPDATE discussions
    SET upvote_count = GREATEST(upvote_count - 1, 0)
    WHERE id = p_discussion_id
    RETURNING upvote_count INTO v_new_count;
    
    RETURN QUERY SELECT false, v_new_count;
  ELSE
    -- Add vote
    INSERT INTO discussion_votes (user_id, discussion_id)
    VALUES (p_user_id, p_discussion_id);
    
    -- Increment count
    UPDATE discussions
    SET upvote_count = upvote_count + 1
    WHERE id = p_discussion_id
    RETURNING upvote_count INTO v_new_count;
    
    RETURN QUERY SELECT true, v_new_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE discussion_votes IS 'Upvotes for discussions';
COMMENT ON COLUMN discussions.upvote_count IS 'Cached count of upvotes for performance';
COMMENT ON FUNCTION toggle_discussion_vote IS 'Atomically toggle vote and update count';

-- =====================================================
-- AUDIT: Cascade Delete Check
-- =====================================================
-- Verify that discussion_comments will cascade delete when discussion is deleted
-- This is already set in supabase-discussion-comments.sql:
-- discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE
-- 
-- To verify, run:
-- SELECT 
--   tc.constraint_name, 
--   tc.table_name, 
--   kcu.column_name,
--   ccu.table_name AS foreign_table_name,
--   ccu.column_name AS foreign_column_name,
--   rc.delete_rule
-- FROM information_schema.table_constraints AS tc
-- JOIN information_schema.key_column_usage AS kcu
--   ON tc.constraint_name = kcu.constraint_name
-- JOIN information_schema.constraint_column_usage AS ccu
--   ON ccu.constraint_name = tc.constraint_name
-- JOIN information_schema.referential_constraints AS rc
--   ON tc.constraint_name = rc.constraint_name
-- WHERE tc.constraint_type = 'FOREIGN KEY'
--   AND tc.table_name = 'discussion_comments';
-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add the upvote system.
-- =====================================================

