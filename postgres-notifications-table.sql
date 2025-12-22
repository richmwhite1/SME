-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
-- Add notifications system to track user activity
-- Run this after the main schema.sql
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('upvote', 'comment', 'follow', 'mention', 'reply', 'badge', 'milestone')),
  target_id UUID,
  target_type TEXT CHECK (target_type IN ('discussion', 'comment', 'product', 'profile')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_id, target_type);

-- Disable RLS for Clerk integration
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE notifications IS 'User notifications for activity and engagement';
COMMENT ON COLUMN notifications.type IS 'Type of notification: upvote, comment, follow, mention, reply, badge, milestone';
COMMENT ON COLUMN notifications.target_id IS 'ID of the related content (discussion, comment, etc.)';
COMMENT ON COLUMN notifications.target_type IS 'Type of target: discussion, comment, product, profile';
COMMENT ON COLUMN notifications.metadata IS 'Additional notification data stored as JSON';

-- =====================================================
-- NOTIFICATIONS TABLE COMPLETE
-- =====================================================
