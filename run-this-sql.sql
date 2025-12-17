-- =====================================================
-- Guest Reviews Migration
-- =====================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- Then click "Run" (or press Cmd/Ctrl + Enter)
-- =====================================================

-- Step 1: Add guest_author_name column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guest_author_name TEXT;

-- Step 2: Make user_id nullable (allows guest reviews without a user account)
-- Note: If this line gives an error, your user_id might already be nullable - that's okay!
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- =====================================================
-- Done! You should see "Success. No rows returned"
-- =====================================================


