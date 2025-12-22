-- =====================================================
-- Guest Reviews Support
-- =====================================================
-- Adds guest_author_name column to allow guest reviews
-- =====================================================

-- Add guest_author_name column to reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guest_author_name TEXT;

-- Make user_id nullable to allow guest reviews
-- Note: This will only work if there are no existing constraints preventing null values
-- If this fails, check your database schema and adjust accordingly
DO $$
BEGIN
  -- Try to make user_id nullable
  -- This will fail silently if already nullable or if there are constraints
  ALTER TABLE reviews ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN others THEN
    -- Column might already be nullable or have constraints
    -- Log the error but continue
    RAISE NOTICE 'Could not make user_id nullable: %', SQLERRM;
END $$;

-- Add comment
COMMENT ON COLUMN reviews.guest_author_name IS 'Display name for guest reviews (when user_id is null)';

-- Create index for filtering guest vs authenticated reviews
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to enable
-- guest reviews with display names.
-- =====================================================

