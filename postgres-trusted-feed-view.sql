DROP VIEW IF EXISTS trusted_feed;

CREATE VIEW trusted_feed AS
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
  AND p.badge_type = 'Trusted Voice'
  AND r.user_id IS NOT NULL

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
  AND p.badge_type = 'Trusted Voice'

ORDER BY created_at DESC;

COMMENT ON VIEW trusted_feed IS 'Activity feed showing only content from Trusted Voice contributors';

