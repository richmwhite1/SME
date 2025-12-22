-- =====================================================
-- Community SME Model: Database Upgrade
-- =====================================================
-- This script upgrades the database to support rich profiles,
-- a follower graph, discussions, and an activity feed.
-- =====================================================

-- =====================================================
-- 1. UPDATE PROFILES TABLE
-- =====================================================
-- Add columns for rich profile information

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS credentials TEXT,
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
  ADD COLUMN IF NOT EXISTS is_verified_expert BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN profiles.bio IS 'User biography/description';
COMMENT ON COLUMN profiles.credentials IS 'Professional credentials or qualifications';
COMMENT ON COLUMN profiles.website_url IS 'Personal or professional website URL';
COMMENT ON COLUMN profiles.instagram_handle IS 'Instagram username (without @)';
COMMENT ON COLUMN profiles.is_verified_expert IS 'Whether the user is a verified expert/SME';

-- =====================================================
-- 2. CREATE FOLLOWS TABLE
-- =====================================================
-- Follower graph for community connections

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Cannot follow yourself
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  
  -- Unique: Can only follow a user once
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON follows(created_at DESC);

-- Add comments
COMMENT ON TABLE follows IS 'Follower graph: tracks who follows whom';
COMMENT ON COLUMN follows.follower_id IS 'The user who is following';
COMMENT ON COLUMN follows.following_id IS 'The user being followed';

-- =====================================================
-- 3. RLS POLICIES FOR FOLLOWS TABLE
-- =====================================================
-- NOTE: If using Clerk for authentication, you may need to:
-- 1. Disable RLS: ALTER TABLE follows DISABLE ROW LEVEL SECURITY;
-- 2. Or adjust policies to work with your Clerk integration
-- The policies below assume Supabase Auth. For Clerk, handle auth in your application layer.

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read follows (public follower graph)
CREATE POLICY "Anyone can read follows"
  ON follows
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create follows
-- NOTE: For Clerk, you'll need to verify auth in your app layer
CREATE POLICY "Authenticated users can create follows"
  ON follows
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    follower_id = auth.uid()::text
  );

-- Policy: Users can delete their own follows (unfollow)
CREATE POLICY "Users can delete their own follows"
  ON follows
  FOR DELETE
  USING (follower_id = auth.uid()::text);

-- =====================================================
-- 4. CREATE DISCUSSIONS TABLE
-- =====================================================
-- Community discussions/forum posts

CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_slug ON discussions(slug);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_tags ON discussions USING GIN(tags);

-- Add comments
COMMENT ON TABLE discussions IS 'Community discussions/forum posts';
COMMENT ON COLUMN discussions.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN discussions.tags IS 'Array of tags for categorization';

-- =====================================================
-- 5. RLS POLICIES FOR DISCUSSIONS TABLE
-- =====================================================
-- NOTE: If using Clerk for authentication, you may need to:
-- 1. Disable RLS: ALTER TABLE discussions DISABLE ROW LEVEL SECURITY;
-- 2. Or adjust policies to work with your Clerk integration
-- The policies below assume Supabase Auth. For Clerk, handle auth in your application layer.

-- Enable RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read discussions
CREATE POLICY "Anyone can read discussions"
  ON discussions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create discussions
-- NOTE: For Clerk, you'll need to verify auth in your app layer
CREATE POLICY "Authenticated users can create discussions"
  ON discussions
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    author_id = auth.uid()::text
  );

-- Policy: Authors can update their own discussions
CREATE POLICY "Authors can update their own discussions"
  ON discussions
  FOR UPDATE
  USING (author_id = auth.uid()::text)
  WITH CHECK (author_id = auth.uid()::text);

-- Policy: Authors can delete their own discussions
CREATE POLICY "Authors can delete their own discussions"
  ON discussions
  FOR DELETE
  USING (author_id = auth.uid()::text);

-- =====================================================
-- 6. CREATE ACTIVITY_FEED VIEW
-- =====================================================
-- Unified view combining reviews and discussions

CREATE OR REPLACE VIEW activity_feed AS
SELECT 
  'review' AS activity_type,
  r.id AS activity_id,
  r.created_at,
  r.user_id AS author_id,
  p.full_name AS author_name,
  p.avatar_url AS author_avatar,
  r.content AS title,
  r.content AS content,
  NULL::TEXT[] AS tags,
  r.protocol_id AS related_id,
  'protocol' AS related_type
FROM reviews r
JOIN profiles p ON r.user_id = p.id

UNION ALL

SELECT 
  'discussion' AS activity_type,
  d.id AS activity_id,
  d.created_at,
  d.author_id,
  p.full_name AS author_name,
  p.avatar_url AS author_avatar,
  d.title,
  d.content,
  d.tags,
  NULL::UUID AS related_id,
  NULL::TEXT AS related_type
FROM discussions d
JOIN profiles p ON d.author_id = p.id

ORDER BY created_at DESC;

-- Add comment
COMMENT ON VIEW activity_feed IS 'Unified activity feed combining reviews and discussions, sorted by time';

-- =====================================================
-- 7. HELPER FUNCTION: Update updated_at timestamp
-- =====================================================
-- Automatically update updated_at when discussions are modified

CREATE OR REPLACE FUNCTION update_discussions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_discussions_updated_at ON discussions;
CREATE TRIGGER trigger_update_discussions_updated_at
  BEFORE UPDATE ON discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussions_updated_at();

-- =====================================================
-- COMPLETE
-- =====================================================
-- All changes have been applied successfully.
-- 
-- Summary:
-- ✓ Profiles table updated with bio, credentials, website_url, instagram_handle, is_verified_expert
-- ✓ Follows table created with follower graph support
-- ✓ Discussions table created for community posts
-- ✓ Activity feed view created combining reviews and discussions
-- ✓ RLS policies configured for security
-- ✓ Indexes created for performance
-- =====================================================

