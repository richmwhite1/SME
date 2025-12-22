-- =====================================================
-- Discussions Flagging System
-- =====================================================
-- Adds flag_count and is_flagged columns to discussions table
-- =====================================================

-- Add flag_count column (default 0)
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0;

-- Add is_flagged column (default false)
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Create index for faster queries on flagged discussions
CREATE INDEX IF NOT EXISTS idx_discussions_is_flagged ON discussions(is_flagged) WHERE is_flagged = true;

-- Add comment
COMMENT ON COLUMN discussions.flag_count IS 'Number of times this discussion has been flagged';
COMMENT ON COLUMN discussions.is_flagged IS 'Whether this discussion is hidden due to flagging (3+ flags)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add flagging
-- support to discussions.
-- =====================================================


