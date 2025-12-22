-- =====================================================
-- Guest Reviews Support - SIMPLE VERSION
-- =====================================================
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add guest_author_name column
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guest_author_name TEXT;

-- Step 2: Make user_id nullable (if it's currently NOT NULL)
-- If this fails, your user_id might already be nullable or have constraints
-- Check the error message and adjust accordingly
ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Step 4: Verify the changes
-- Run this to check:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'reviews' AND column_name IN ('user_id', 'guest_author_name');


