-- =====================================================
-- UNIFIED VOTES AND REACTIONS MIGRATION
-- =====================================================

-- 1. Create unified votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('product', 'discussion', 'comment', 'review', 'unknown')), 
  vote_type INTEGER NOT NULL CHECK (vote_type IN (1, -1)), -- 1 for upvote, -1 for downvote
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Check constraint to ensure resource_id exists in one of the tables
  -- Note: We can't easily enforce foreign keys across multiple tables with a single column in standard SQL 
  -- without complex triggers or inheritance, so we rely on application logic + cleanup.
  -- However, for data integrity, we should ensure the application handles deletions.
  
  CONSTRAINT unique_user_resource_vote UNIQUE (user_id, resource_id, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_votes_resource ON votes(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_votes_user ON votes(user_id);

-- 2. Create reactions table (Truth Signals)
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('product', 'discussion', 'comment', 'review')),
  emoji_type TEXT NOT NULL, -- 🧐, ⚠️, 🎯, ✅, 🧬, 🔬
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_resource_reaction UNIQUE (user_id, resource_id, resource_type, emoji_type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_resource ON reactions(resource_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_reactions_emoji ON reactions(emoji_type);

-- 3. Add upvote_count to tables if missing
-- Products
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'upvote_count') THEN
        ALTER TABLE products ADD COLUMN upvote_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Reviews
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'upvote_count') THEN
        ALTER TABLE reviews ADD COLUMN upvote_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Enable RLS (and then disable for now as per other tables in this codebase seems to default to disabled/handled by logic)
ALTER TABLE votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- 5. Comments
COMMENT ON TABLE votes IS 'Unified upvotes/downvotes for all resources';
COMMENT ON TABLE reactions IS 'Truth Signal reactions for all resources';
