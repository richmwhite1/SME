-- Add status column to comment tables for soft moderation
-- Status values: 'approved', 'pending_review', 'rejected'

ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Add index for filtering by status
CREATE INDEX IF NOT EXISTS idx_discussion_comments_status ON discussion_comments(status);
CREATE INDEX IF NOT EXISTS idx_product_comments_status ON product_comments(status);
