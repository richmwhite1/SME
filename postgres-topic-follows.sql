-- =====================================================
-- Topic Follows Table
-- =====================================================
-- Creates the topic_follows table for users to follow topics/tags
-- =====================================================

CREATE TABLE IF NOT EXISTS topic_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint: User can only follow a topic once
  CONSTRAINT unique_topic_follow UNIQUE (user_id, topic_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topic_follows_user_id ON topic_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_topic_follows_topic_name ON topic_follows(topic_name);
CREATE INDEX IF NOT EXISTS idx_topic_follows_created_at ON topic_follows(created_at DESC);

-- RLS (Row Level Security) - DISABLED for Clerk Integration
ALTER TABLE topic_follows DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE topic_follows IS 'Users following specific topics/tags';
COMMENT ON COLUMN topic_follows.topic_name IS 'The topic/tag name (e.g., Biohacking, Longevity)';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the topic follows table.
-- =====================================================





