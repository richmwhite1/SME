-- Add metadata column to discussion_comments
ALTER TABLE discussion_comments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN discussion_comments.metadata IS 'Additional metadata like x_post_url';

-- Add metadata column to product_comments
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN product_comments.metadata IS 'Additional metadata like x_post_url';
