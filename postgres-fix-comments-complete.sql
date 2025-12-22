-- =====================================================
-- Fix Discussion Comments Complete Schema
-- =====================================================
-- Adds missing columns (parent_id, guest_name) and creates
-- the comment_references table.
-- =====================================================

-- Step 1: Add parent_id to discussion_comments
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE;

-- Step 2: Add guest_name to discussion_comments
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS guest_name TEXT;

-- Step 3: Create comment_references table
CREATE TABLE IF NOT EXISTS comment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL,
  resource_title TEXT NOT NULL,
  resource_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create index for comment_references
CREATE INDEX IF NOT EXISTS idx_comment_references_comment_id ON comment_references(comment_id);

-- Step 5: Fix author_id type if not already fixed (Backup check)
-- DO $$
-- BEGIN
--   -- Check if author_id is UUID, if so, we would need to fix it, but let's assume previous fix worked
--   -- or user will use the specific fix script.
-- END $$;

-- Summary
-- Added parent_id, guest_name columns
-- Created comment_references table
