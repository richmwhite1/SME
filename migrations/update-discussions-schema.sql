-- Add missing columns to discussions table
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS reference_url TEXT;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_bounty BOOLEAN DEFAULT FALSE;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS bounty_status TEXT DEFAULT 'open';
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS solution_comment_id UUID;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_discussions_is_bounty ON discussions(is_bounty);

-- Re-attempt creation of missing tables with correct types

-- Discussion Flags (Moderation) - Fixed flagger_by type to TEXT
CREATE TABLE IF NOT EXISTS discussion_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  flagged_by TEXT REFERENCES profiles(id), -- Changed from UUID to TEXT
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(discussion_id, flagged_by),
  UNIQUE(comment_id, flagged_by)
);

-- Discussion Comments missing columns?
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS is_official_response BOOLEAN DEFAULT FALSE;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS post_type TEXT;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS pillar_of_truth TEXT;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS insight_summary TEXT;
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Comment References (Citations)
CREATE TABLE IF NOT EXISTS comment_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
    resource_id TEXT,
    resource_title TEXT,
    resource_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment Signals (Raise Hand / Reaction) - if causing errors
CREATE TABLE IF NOT EXISTS comment_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES profiles(id),
  signal_type TEXT NOT NULL, -- 'raise_hand'
  created_at TIMESTAMPTZ DEFAULT NOW()
);
