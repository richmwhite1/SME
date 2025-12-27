-- Add columns to product_comments
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS is_official_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS raise_hand_count INTEGER DEFAULT 0;

-- Add columns to discussion_comments
-- Ensure parent_id exists (just in case, though app implies it does)
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS is_official_response BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS raise_hand_count INTEGER DEFAULT 0;
-- Note: parent_id should already exist from threading migration.

-- Create comment_signals table
CREATE TABLE IF NOT EXISTS comment_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Clerk ID
  product_comment_id UUID REFERENCES product_comments(id) ON DELETE CASCADE,
  discussion_comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  signal_type TEXT NOT NULL DEFAULT 'raise_hand',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: Must target exactly one comment type
  CONSTRAINT one_target_comment CHECK (
    (product_comment_id IS NOT NULL AND discussion_comment_id IS NULL) OR
    (product_comment_id IS NULL AND discussion_comment_id IS NOT NULL)
  ),
  
  -- Constraint: User can only signal a comment once per type
  UNIQUE(user_id, product_comment_id, signal_type),
  UNIQUE(user_id, discussion_comment_id, signal_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_signals_product_comment ON comment_signals(product_comment_id);
CREATE INDEX IF NOT EXISTS idx_signals_discussion_comment ON comment_signals(discussion_comment_id);
CREATE INDEX IF NOT EXISTS idx_signals_user ON comment_signals(user_id);

-- Add comments for documentation
COMMENT ON TABLE comment_signals IS 'Tracks user signals (like Raise Hand) on comments';
