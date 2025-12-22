-- =====================================================
-- Product Comments Table - SIMPLE VERSION
-- =====================================================
-- Creates the product_comments table without foreign key constraints
-- You can add foreign keys later if needed
-- =====================================================

CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL,
  author_id TEXT NOT NULL,
  content TEXT NOT NULL,
  flag_count INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_comments_protocol_id ON product_comments(protocol_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_id ON product_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_is_flagged ON product_comments(is_flagged) WHERE is_flagged = true;

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE product_comments DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE product_comments IS 'Comments on products/protocols';
COMMENT ON COLUMN product_comments.flag_count IS 'Number of times this comment has been flagged';
COMMENT ON COLUMN product_comments.is_flagged IS 'Whether this comment is hidden due to flagging (3+ flags)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- This creates the table without foreign key constraints.
-- The application code will handle referential integrity.
-- =====================================================





