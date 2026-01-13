-- FIX PRODUCT COMMENTS SCHEMA
-- Re-aligns the database table with the application code in product-actions.ts

-- 1. Create table if it literally doesn't exist
CREATE TABLE IF NOT EXISTS product_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Structure Fixes (Renaming/Aliasing)
DO $$
BEGIN
    -- If user_id exists but author_id does not, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_comments' AND column_name = 'user_id') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_comments' AND column_name = 'author_id') THEN
        ALTER TABLE product_comments RENAME COLUMN user_id TO author_id;
    END IF;
END $$;

-- 3. Add Missing Columns (Idempotent)
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS author_id TEXT REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES product_comments(id);
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS is_official_response BOOLEAN DEFAULT false;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS post_type TEXT; -- 'verified_insight', 'community_experience'
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS pillar_of_truth TEXT;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS source_metadata JSONB;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS star_rating INTEGER;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS citation_screened_ok BOOLEAN DEFAULT false;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0;
ALTER TABLE product_comments ADD COLUMN IF NOT EXISTS insight_summary TEXT;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_product_comments_product_id ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_author_id ON product_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_parent_id ON product_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_product_comments_created_at ON product_comments(created_at DESC);
