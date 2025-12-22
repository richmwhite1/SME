-- =====================================================
-- Global Feed View
-- =====================================================
-- Creates a view combining all activity (reviews + discussions)
-- for the global "Community Pulse" feed
-- =====================================================

CREATE OR REPLACE VIEW global_feed AS
SELECT
  'review' AS activity_type,
  r.id AS activity_id,
  r.created_at,
  r.user_id AS author_id,
  COALESCE(p.full_name, r.guest_author_name, 'Guest') AS author_name,
  p.avatar_url AS author_avatar,
  pr.title AS title,
  r.content,
  NULL::text[] AS tags,
  r.protocol_id AS related_id,
  'protocol' AS related_type,
  pr.slug AS protocol_slug,
  pr.title AS protocol_title,
  p.badge_type AS author_badge_type
FROM reviews r
LEFT JOIN profiles p ON r.user_id = p.id
LEFT JOIN protocols pr ON r.protocol_id = pr.id
WHERE r.is_flagged = false

UNION ALL

SELECT
  'discussion' AS activity_type,
  d.id AS activity_id,
  d.created_at,
  d.author_id::text AS author_id,
  COALESCE(p.full_name, 'Anonymous') AS author_name,
  p.avatar_url AS author_avatar,
  d.title,
  d.content,
  d.tags,
  NULL AS related_id,
  NULL AS related_type,
  d.slug AS protocol_slug,
  d.title AS protocol_title,
  p.badge_type AS author_badge_type
FROM discussions d
LEFT JOIN profiles p ON d.author_id = p.id
WHERE COALESCE(d.is_flagged, false) = false

ORDER BY created_at DESC;

-- Add comment
COMMENT ON VIEW global_feed IS 'Global activity feed showing all reviews and discussions';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the global feed view.
-- =====================================================

