
-- Add upvote_count to reviews if not exists
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;

-- Update comment_votes constraint
ALTER TABLE comment_votes 
DROP CONSTRAINT IF EXISTS comment_votes_comment_type_check;

ALTER TABLE comment_votes 
ADD CONSTRAINT comment_votes_comment_type_check 
CHECK (comment_type IN ('discussion', 'product', 'review'));
