
-- Allow author_id to be NULL for product_comments (for guest comments)
ALTER TABLE product_comments 
ALTER COLUMN author_id DROP NOT NULL;
