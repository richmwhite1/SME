-- =====================================================
-- Add is_pinned Column to Discussions Table
-- =====================================================
-- Adds support for pinning discussions (e.g., topic introductions)
-- =====================================================

-- Add is_pinned column if it doesn't exist
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Create index for efficient queries of pinned discussions
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON discussions(is_pinned) WHERE is_pinned = true;

-- Add comment
COMMENT ON COLUMN discussions.is_pinned IS 'Whether this discussion is pinned to the top of topic feeds';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- support for pinned discussions.
-- =====================================================





