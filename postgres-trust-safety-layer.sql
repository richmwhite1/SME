-- =====================================================
-- Trust & Safety Layer - Database Schema
-- =====================================================
-- Creates tables and columns for Revenue Guard, Disputes,
-- Admin Logging, and User Banning
-- =====================================================

-- =====================================================
-- 1. Keyword Blacklist Table
-- =====================================================
CREATE TABLE IF NOT EXISTS keyword_blacklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  reason TEXT,
  created_by TEXT, -- Admin user ID who added it
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_keyword_blacklist_keyword ON keyword_blacklist(keyword) WHERE is_active = true;
CREATE INDEX idx_keyword_blacklist_active ON keyword_blacklist(is_active) WHERE is_active = true;

ALTER TABLE keyword_blacklist DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE keyword_blacklist IS 'Blacklisted keywords for Revenue Guard (competitor URLs, discount codes, etc.)';
COMMENT ON COLUMN keyword_blacklist.keyword IS 'The blacklisted keyword or phrase (case-insensitive matching)';
COMMENT ON COLUMN keyword_blacklist.reason IS 'Reason for blacklisting (e.g., competitor URL, spam code)';

-- =====================================================
-- 2. Add Dispute Fields to Moderation Queue
-- =====================================================
ALTER TABLE moderation_queue 
  ADD COLUMN IF NOT EXISTS dispute_reason TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'disputed', 'resolved'));

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON moderation_queue(status);

COMMENT ON COLUMN moderation_queue.dispute_reason IS 'Reason provided by comment author when disputing removal';
COMMENT ON COLUMN moderation_queue.status IS 'Status: pending (awaiting review), disputed (author disputed), resolved (admin reviewed)';

-- =====================================================
-- 3. Add is_banned to Profiles Table
-- =====================================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS ban_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = true;

COMMENT ON COLUMN profiles.is_banned IS 'Whether the user is banned from posting content';
COMMENT ON COLUMN profiles.banned_at IS 'When the user was banned';
COMMENT ON COLUMN profiles.ban_reason IS 'Reason for the ban';

-- =====================================================
-- 4. Admin Logs Table
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL, -- Admin user ID
  action_type TEXT NOT NULL, -- 'restore', 'purge', 'ban', 'unban', 'add_blacklist', 'remove_blacklist'
  target_type TEXT, -- 'comment', 'user', 'keyword'
  target_id TEXT, -- ID of the target (comment_id, user_id, keyword_id)
  reason TEXT, -- Optional reason provided by admin
  metadata JSONB, -- Additional context (e.g., flag_count, original_content)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_action_type ON admin_logs(action_type);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at DESC);

ALTER TABLE admin_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE admin_logs IS 'Audit log of all admin actions for accountability';
COMMENT ON COLUMN admin_logs.action_type IS 'Type of action: restore, purge, ban, unban, add_blacklist, remove_blacklist';
COMMENT ON COLUMN admin_logs.metadata IS 'Additional context stored as JSON (flag_count, content preview, etc.)';

-- =====================================================
-- 5. Function: Check Keyword Blacklist
-- =====================================================
CREATE OR REPLACE FUNCTION check_keyword_blacklist(p_content TEXT)
RETURNS TABLE(keyword TEXT, reason TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT kb.keyword, kb.reason
  FROM keyword_blacklist kb
  WHERE kb.is_active = true
    AND LOWER(p_content) LIKE '%' || LOWER(kb.keyword) || '%';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_keyword_blacklist IS 'Checks if content contains any blacklisted keywords (case-insensitive)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the Trust & Safety Layer infrastructure
-- =====================================================

