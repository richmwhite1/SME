-- =====================================================
-- Discussion Flags Table
-- =====================================================
-- Creates the discussion_flags table to track individual flag records
-- A database trigger will handle auto-archival to moderation_queue
-- =====================================================

-- Drop existing table and trigger if they exist (to start fresh)
DROP TRIGGER IF EXISTS trigger_archive_flagged_comment ON discussion_flags;
DROP FUNCTION IF EXISTS archive_flagged_comment();
DROP TABLE IF EXISTS discussion_flags CASCADE;

-- Create discussion_flags table
CREATE TABLE discussion_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES discussion_comments(id) ON DELETE CASCADE,
  flagged_by TEXT NOT NULL, -- User ID who flagged the comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_discussion_flags_comment_id ON discussion_flags(comment_id);
CREATE INDEX idx_discussion_flags_flagged_by ON discussion_flags(flagged_by);
CREATE INDEX idx_discussion_flags_created_at ON discussion_flags(created_at DESC);

-- Prevent duplicate flags from same user
CREATE UNIQUE INDEX idx_discussion_flags_unique_user_comment 
ON discussion_flags(comment_id, flagged_by);

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE discussion_flags DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE discussion_flags IS 'Individual flag records for discussion comments';
COMMENT ON COLUMN discussion_flags.comment_id IS 'The comment being flagged';
COMMENT ON COLUMN discussion_flags.flagged_by IS 'User ID of the person who flagged';

-- =====================================================
-- Trigger Function: Auto-archive flagged comments
-- =====================================================
-- This trigger automatically moves comments to moderation_queue
-- when they reach 3+ flags
-- =====================================================

CREATE OR REPLACE FUNCTION archive_flagged_comment()
RETURNS TRIGGER AS $$
DECLARE
  v_flag_count INTEGER;
  v_comment_record RECORD;
BEGIN
  -- Get the current flag count for this comment
  SELECT COUNT(*) INTO v_flag_count
  FROM discussion_flags
  WHERE comment_id = NEW.comment_id;

  -- Update the flag_count in discussion_comments
  UPDATE discussion_comments
  SET flag_count = v_flag_count,
      is_flagged = (v_flag_count >= 3)
  WHERE id = NEW.comment_id;

  -- If flag count reaches 3+, move to moderation_queue
  IF v_flag_count >= 3 THEN
    -- Get the full comment record
    SELECT * INTO v_comment_record
    FROM discussion_comments
    WHERE id = NEW.comment_id;

    -- Only insert if not already in queue
    INSERT INTO moderation_queue (
      original_comment_id,
      comment_type,
      discussion_id,
      author_id,
      guest_name,
      content,
      flag_count,
      original_created_at,
      parent_id
    )
    SELECT 
      v_comment_record.id,
      'discussion',
      v_comment_record.discussion_id,
      v_comment_record.author_id,
      v_comment_record.guest_name,
      v_comment_record.content,
      v_flag_count,
      v_comment_record.created_at,
      v_comment_record.parent_id
    WHERE NOT EXISTS (
      SELECT 1 FROM moderation_queue 
      WHERE original_comment_id = v_comment_record.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_archive_flagged_comment
  AFTER INSERT ON discussion_flags
  FOR EACH ROW
  EXECUTE FUNCTION archive_flagged_comment();

-- Add comment
COMMENT ON FUNCTION archive_flagged_comment IS 'Automatically archives comments to moderation_queue when they reach 3+ flags';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the discussion_flags table and auto-archival trigger
-- =====================================================

