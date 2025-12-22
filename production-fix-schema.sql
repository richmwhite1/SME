-- =====================================================
-- PRODUCTION FIX: Add Missing Notifications Table
-- =====================================================
-- Run this on Railway Postgres to add the notifications table
-- that is missing from the main schema.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reply', 'upvote', 'citation', 'follow')),
  target_id TEXT NOT NULL,
  target_type TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Disable RLS for Clerk integration
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE notifications IS 'User notifications for replies, upvotes, citations, and follows';
COMMENT ON COLUMN notifications.user_id IS 'The user receiving the notification';
COMMENT ON COLUMN notifications.actor_id IS 'The user who triggered the notification';
COMMENT ON COLUMN notifications.type IS 'Type of notification: reply, upvote, citation, follow';
COMMENT ON COLUMN notifications.target_id IS 'ID of the target item (discussion, comment, product, etc.)';
COMMENT ON COLUMN notifications.target_type IS 'Type of target: discussion, comment, product, user';
COMMENT ON COLUMN notifications.metadata IS 'Additional data for grouped notifications';

-- =====================================================
-- Verify table was created
-- =====================================================
SELECT 'Notifications table created successfully' AS status;
SELECT COUNT(*) AS notification_count FROM notifications;
