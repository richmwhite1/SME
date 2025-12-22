-- =====================================================
-- Comments Threading & Citations Schema
-- =====================================================
-- Adds parent_id for nested threading and comment_references
-- for multi-reference citation system
-- =====================================================

-- Step 1: Add parent_id to discussion_comments for threading
ALTER TABLE discussion_comments 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE;

-- Step 2: Create index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_id 
  ON discussion_comments(parent_id) 
  WHERE parent_id IS NOT NULL;

-- Step 3: Create comment_references junction table for citations
CREATE TABLE IF NOT EXISTS comment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL, -- References resource_library.origin_id
  resource_title TEXT NOT NULL,
  resource_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes for comment_references
CREATE INDEX IF NOT EXISTS idx_comment_references_comment_id 
  ON comment_references(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_references_resource_id 
  ON comment_references(resource_id);

-- Step 5: Disable RLS for comment_references (using Clerk auth)
ALTER TABLE comment_references DISABLE ROW LEVEL SECURITY;

-- Step 6: Add parent_id to product_comments as well (for consistency)
ALTER TABLE product_comments 
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES product_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id 
  ON product_comments(parent_id) 
  WHERE parent_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN discussion_comments.parent_id IS 'Self-referencing foreign key for nested comment threading';
COMMENT ON TABLE comment_references IS 'Junction table linking comments to Evidence Vault resources (citations)';
COMMENT ON COLUMN comment_references.resource_id IS 'References resource_library.origin_id (can be from Product or Discussion)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to enable
-- threaded comments and multi-reference citations.
-- =====================================================



