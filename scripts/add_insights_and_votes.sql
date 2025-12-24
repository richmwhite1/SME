-- Add insight_summary and upvote_count to discussion_comments
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS insight_summary TEXT,
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Add insight_summary and upvote_count to product_comments
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS insight_summary TEXT,
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Create comments_votes table to track user votes on comments
CREATE TABLE IF NOT EXISTS comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_id UUID NOT NULL,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('discussion', 'product')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one vote per user per comment
  CONSTRAINT unique_user_comment_vote UNIQUE (user_id, comment_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_votes_user ON comment_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_votes_comment ON comment_votes(comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_upvotes ON discussion_comments(upvote_count DESC);
CREATE INDEX IF NOT EXISTS idx_product_comments_upvotes ON product_comments(upvote_count DESC);

-- Disable RLS
ALTER TABLE comment_votes DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE comment_votes IS 'Track upvotes on discussion and product comments';
