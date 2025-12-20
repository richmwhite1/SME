-- =====================================================
-- Moderation Queue Table
-- =====================================================
-- Creates the moderation_queue table for admin review
-- of flagged comments from both discussion_comments and product_comments
-- =====================================================

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS moderation_queue CASCADE;

-- Create the moderation_queue table
CREATE TABLE moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_comment_id UUID NOT NULL, -- Original comment ID (from discussion_comments.id or product_comments.id)
  comment_type TEXT NOT NULL CHECK (comment_type IN ('discussion', 'product')), -- Type of comment
  discussion_id UUID, -- For discussion comments (nullable)
  protocol_id UUID, -- For product comments (nullable)
  author_id TEXT, -- Can be null for guest comments (TEXT to match both schemas)
  guest_name TEXT, -- For guest comments
  content TEXT NOT NULL,
  flag_count INTEGER NOT NULL DEFAULT 0,
  original_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  parent_id UUID, -- For threaded comments
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_moderation_queue_original_comment_id ON moderation_queue(original_comment_id);
CREATE INDEX idx_moderation_queue_comment_type ON moderation_queue(comment_type);
CREATE INDEX idx_moderation_queue_discussion_id ON moderation_queue(discussion_id) WHERE discussion_id IS NOT NULL;
CREATE INDEX idx_moderation_queue_protocol_id ON moderation_queue(protocol_id) WHERE protocol_id IS NOT NULL;
CREATE INDEX idx_moderation_queue_author_id ON moderation_queue(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX idx_moderation_queue_queued_at ON moderation_queue(queued_at DESC);
CREATE INDEX idx_moderation_queue_flag_count ON moderation_queue(flag_count DESC);

-- Add foreign key constraints (optional, for referential integrity)
-- These are added separately to avoid errors if tables don't exist
DO $$
BEGIN
  -- Add foreign key to discussions table (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussions') THEN
    BEGIN
      ALTER TABLE moderation_queue
        ADD CONSTRAINT moderation_queue_discussion_id_fkey
        FOREIGN KEY (discussion_id) REFERENCES discussions(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key to discussions table: %', SQLERRM;
    END;
  END IF;

  -- Add foreign key to protocols table (if it exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'protocols') THEN
    BEGIN
      ALTER TABLE moderation_queue
        ADD CONSTRAINT moderation_queue_protocol_id_fkey
        FOREIGN KEY (protocol_id) REFERENCES protocols(id) ON DELETE CASCADE;
    EXCEPTION WHEN others THEN
      RAISE NOTICE 'Could not add foreign key to protocols table: %', SQLERRM;
    END;
  END IF;
END $$;

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE moderation_queue DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE moderation_queue IS 'Queue of flagged comments awaiting admin moderation review';
COMMENT ON COLUMN moderation_queue.original_comment_id IS 'Original comment ID from discussion_comments.id or product_comments.id';
COMMENT ON COLUMN moderation_queue.comment_type IS 'Type of comment: discussion or product';
COMMENT ON COLUMN moderation_queue.discussion_id IS 'Discussion ID (for discussion comments only)';
COMMENT ON COLUMN moderation_queue.protocol_id IS 'Protocol/Product ID (for product comments only)';
COMMENT ON COLUMN moderation_queue.flag_count IS 'Number of flags that triggered the move to queue';
COMMENT ON COLUMN moderation_queue.queued_at IS 'When the comment was moved to moderation queue';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the moderation_queue table for admin review
-- =====================================================

