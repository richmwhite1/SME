-- Core Discussions Table
CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES profiles(id),
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[],
  reference_url TEXT,
  flag_count INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  upvote_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  is_bounty BOOLEAN DEFAULT FALSE,
  bounty_status TEXT DEFAULT 'open', -- 'open', 'resolved', 'expired'
  solution_comment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion Comments
CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  guest_name TEXT, -- For unauthenticated comments if allowed (though action restricts it)
  content TEXT NOT NULL,
  parent_id UUID REFERENCES discussion_comments(id),
  flag_count INT DEFAULT 0,
  is_flagged BOOLEAN DEFAULT FALSE,
  is_official_response BOOLEAN DEFAULT FALSE,
  post_type TEXT, -- 'verified_insight', 'community_experience'
  pillar_of_truth TEXT,
  insight_summary TEXT, -- AI generated summary
  status TEXT DEFAULT 'approved', -- 'approved', 'pending_review', 'rejected'
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Discussion Flags (Moderation)
CREATE TABLE IF NOT EXISTS discussion_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
  flagged_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one flag per user per item
  UNIQUE(discussion_id, flagged_by),
  UNIQUE(comment_id, flagged_by)
);

-- Comment References (Citations)
CREATE TABLE IF NOT EXISTS comment_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID REFERENCES discussion_comments(id) ON DELETE CASCADE,
    resource_id TEXT,
    resource_title TEXT,
    resource_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_discussion ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON discussion_comments(author_id);
