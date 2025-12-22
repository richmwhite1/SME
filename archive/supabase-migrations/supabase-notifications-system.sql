-- =====================================================
-- Notifications & SME Tracking System
-- =====================================================
-- Creates notifications table and updates follows table
-- for tracking SMEs and generating notifications
-- =====================================================

-- =====================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'upvote', 'citation', 'follow')),
  target_id TEXT NOT NULL, -- Can reference discussions, comments, products, etc.
  target_type TEXT, -- 'discussion', 'comment', 'product', 'user', etc.
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata for grouped notifications (e.g., multiple upvotes)
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for replies, upvotes, citations, and follows';
COMMENT ON COLUMN notifications.user_id IS 'The user receiving the notification';
COMMENT ON COLUMN notifications.actor_id IS 'The user who triggered the notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification: reply, upvote, citation, follow';
COMMENT ON COLUMN notifications.target_id IS 'ID of the target item (discussion, comment, product, etc.)';
COMMENT ON COLUMN notifications.target_type IS 'Type of target: discussion, comment, product, user';
COMMENT ON COLUMN notifications.metadata IS 'Additional data for grouped notifications (e.g., upvote count)';

-- =====================================================
-- 2. UPDATE FOLLOWS TABLE FOR SME TRACKING
-- =====================================================

-- Add target_type column to follows table
ALTER TABLE follows 
  ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'user' CHECK (target_type IN ('user', 'topic'));

-- Update existing rows to have target_type = 'user'
UPDATE follows SET target_type = 'user' WHERE target_type IS NULL;

-- Add comment
COMMENT ON COLUMN follows.target_type IS 'Type of follow: user (SME tracking) or topic';

-- =====================================================
-- 3. NOTIFICATION TRIGGER FUNCTIONS
-- =====================================================

-- Function to create notification on comment reply
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
  discussion_id_val UUID;
BEGIN
  -- Only notify if this is a reply (has parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the parent comment's author and discussion_id
    INSERT INTO notifications (user_id, actor_id, type, target_id, target_type, metadata)
    SELECT 
      parent.author_id,
      NEW.author_id,
      'reply',
      NEW.id,
      'comment',
      jsonb_build_object('discussion_id', parent.discussion_id, 'parent_id', parent.id)
    FROM discussion_comments parent
    WHERE parent.id = NEW.parent_id
      AND parent.author_id != NEW.author_id; -- Don't notify self;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on discussion upvote
CREATE OR REPLACE FUNCTION notify_discussion_upvote()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the discussion author
  INSERT INTO notifications (user_id, actor_id, type, target_id, target_type)
  SELECT 
    d.author_id,
    NEW.user_id,
    'upvote',
    NEW.discussion_id,
    'discussion'
  FROM discussions d
  WHERE d.id = NEW.discussion_id
    AND d.author_id != NEW.user_id; -- Don't notify self
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on citation
CREATE OR REPLACE FUNCTION notify_citation()
RETURNS TRIGGER AS $$
DECLARE
  comment_author_id TEXT;
BEGIN
  -- Get the comment author
  SELECT author_id INTO comment_author_id
  FROM discussion_comments
  WHERE id = NEW.comment_id;
  
  -- Get the resource author (from resource_library)
  -- Notify the resource author that their evidence was cited
  INSERT INTO notifications (user_id, actor_id, type, target_id, target_type)
  SELECT 
    rl.author_id,
    comment_author_id,
    'citation',
    NEW.resource_id,
    'evidence'
  FROM resource_library rl
  WHERE rl.origin_id = NEW.resource_id
    AND rl.author_id != comment_author_id; -- Don't notify self
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification on follow
CREATE OR REPLACE FUNCTION notify_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the user being followed
  INSERT INTO notifications (user_id, actor_id, type, target_id, target_type)
  VALUES (
    NEW.following_id,
    NEW.follower_id,
    'follow',
    NEW.following_id,
    'user'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGERS
-- =====================================================

-- Trigger for comment replies
DROP TRIGGER IF EXISTS trigger_notify_comment_reply ON discussion_comments;
CREATE TRIGGER trigger_notify_comment_reply
  AFTER INSERT ON discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_comment_reply();

-- Note: Discussion upvotes would need a discussion_votes table
-- This is a placeholder - adjust based on your actual upvote implementation

-- Trigger for citations
DROP TRIGGER IF EXISTS trigger_notify_citation ON comment_references;
CREATE TRIGGER trigger_notify_citation
  AFTER INSERT ON comment_references
  FOR EACH ROW
  EXECUTE FUNCTION notify_citation();

-- Trigger for follows
DROP TRIGGER IF EXISTS trigger_notify_follow ON follows;
CREATE TRIGGER trigger_notify_follow
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_follow();

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the notifications system and SME tracking.
-- =====================================================



