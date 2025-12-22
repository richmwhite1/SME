-- =====================================================
-- Create Follower Feed View
-- =====================================================
-- Creates a view that shows activity from users you follow
-- =====================================================

CREATE OR REPLACE VIEW follower_feed AS
SELECT 
  af.activity_type,
  af.activity_id,
  af.created_at,
  af.author_id,
  af.author_name,
  af.author_avatar,
  af.title,
  af.content,
  af.tags,
  af.related_id,
  af.related_type,
  f.follower_id AS viewer_id
FROM activity_feed af
JOIN follows f ON af.author_id = f.following_id
WHERE af.author_id IS NOT NULL
ORDER BY af.created_at DESC;

-- Add comment
COMMENT ON VIEW follower_feed IS 'Activity feed filtered to show only content from users you follow';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the follower_feed view.
-- =====================================================


