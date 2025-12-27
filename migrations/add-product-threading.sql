-- Add parent_id to product_comments for threading
ALTER TABLE product_comments 
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES product_comments(id) ON DELETE CASCADE;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_product_comments_parent ON product_comments(parent_id);
