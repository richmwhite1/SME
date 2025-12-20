-- =====================================================
-- Migration: Add target_type column to follows table
-- =====================================================
-- This migration adds a target_type column to support
-- following different types of entities (users, topics, etc.)
-- =====================================================

-- Add target_type column if it doesn't exist
ALTER TABLE follows 
  ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'user';

-- Update existing rows to have 'user' as target_type
UPDATE follows 
  SET target_type = 'user' 
  WHERE target_type IS NULL;

-- Add comment
COMMENT ON COLUMN follows.target_type IS 'Type of entity being followed: user, topic, etc.';

-- Note: This migration is optional. The Feed page has been updated
-- to work without this column. If you want to support following
-- different entity types in the future, run this migration.

