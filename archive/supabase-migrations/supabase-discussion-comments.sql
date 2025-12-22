-- =====================================================
-- Discussion Comments Table
-- =====================================================
-- Creates the discussion_comments table for threaded comments
-- =====================================================

CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_id ON discussion_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON discussion_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_is_flagged ON discussion_comments(is_flagged) WHERE is_flagged = true;

-- RLS (Row Level Security) - DISABLED for Clerk Integration
-- Since we're using Clerk for authentication (not Supabase Auth),
-- we disable RLS and handle authentication in the application layer.
ALTER TABLE discussion_comments DISABLE ROW LEVEL SECURITY;

-- Note: Authentication is handled in the application layer using Clerk's currentUser()
-- The server actions already check for authentication before allowing inserts/updates.

-- Add comments
COMMENT ON TABLE discussion_comments IS 'Comments on discussions';
COMMENT ON COLUMN discussion_comments.flag_count IS 'Number of times this comment has been flagged';
COMMENT ON COLUMN discussion_comments.is_flagged IS 'Whether this comment is hidden due to flagging (3+ flags)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the discussion comments table.
-- =====================================================

