-- =====================================================
-- Auto-Classification Fields Migration
-- =====================================================
-- Adds post_type, pillar_of_truth, and source_metadata
-- fields to support automated citation classification
-- =====================================================

-- Step 1: Add auto-classification fields to discussion_comments
ALTER TABLE discussion_comments
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'community_experience' 
    CHECK (post_type IN ('verified_insight', 'community_experience')),
  ADD COLUMN IF NOT EXISTS pillar_of_truth TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- Step 2: Add auto-classification fields to product_comments
ALTER TABLE product_comments
  ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'community_experience'
    CHECK (post_type IN ('verified_insight', 'community_experience')),
  ADD COLUMN IF NOT EXISTS pillar_of_truth TEXT,
  ADD COLUMN IF NOT EXISTS source_metadata JSONB;

-- Step 3: Create indexes for efficient filtering
CREATE INDEX IF NOT EXISTS idx_discussion_comments_post_type 
  ON discussion_comments(post_type);

CREATE INDEX IF NOT EXISTS idx_discussion_comments_pillar 
  ON discussion_comments(pillar_of_truth) 
  WHERE pillar_of_truth IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_comments_post_type 
  ON product_comments(post_type);

CREATE INDEX IF NOT EXISTS idx_product_comments_pillar 
  ON product_comments(pillar_of_truth) 
  WHERE pillar_of_truth IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN discussion_comments.post_type IS 'Auto-classified type: verified_insight (has citation) or community_experience (no citation)';
COMMENT ON COLUMN discussion_comments.pillar_of_truth IS 'Required pillar mapping for verified insights (e.g., Biochemistry, Sustainability, Bio-availability)';
COMMENT ON COLUMN discussion_comments.source_metadata IS 'Cached metadata from citation URL (title, favicon, description) for preview display';

COMMENT ON COLUMN product_comments.post_type IS 'Auto-classified type: verified_insight (has citation) or community_experience (no citation)';
COMMENT ON COLUMN product_comments.pillar_of_truth IS 'Required pillar mapping for verified insights (e.g., Biochemistry, Sustainability, Bio-availability)';
COMMENT ON COLUMN product_comments.source_metadata IS 'Cached metadata from citation URL (title, favicon, description) for preview display';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL to add auto-classification support
-- =====================================================
