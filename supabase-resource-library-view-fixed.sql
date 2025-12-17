-- =====================================================
-- Resource Library View (Evidence Vault) - FIXED VERSION
-- =====================================================
-- Creates a view of all reference URLs from Trusted Voices
-- Only includes sources from discussions and products where author is Trusted Voice
-- =====================================================

-- Drop the existing view first to avoid column name conflicts
DROP VIEW IF EXISTS resource_library;

-- Create the view with correct column names matching the frontend
CREATE VIEW resource_library AS
-- Sources from Products/Protocols
-- Uses created_by field if it exists, otherwise includes all products with reference_url
SELECT
  'Product' AS origin_type,
  pr.id AS origin_id,
  pr.slug AS origin_slug,
  pr.title AS title,
  pr.reference_url AS reference_url,
  pr.created_at AS created_at,
  p.id AS author_id,
  p.full_name AS author_name,
  p.username AS author_username
FROM protocols pr
LEFT JOIN profiles p ON pr.created_by = p.id
WHERE pr.reference_url IS NOT NULL
  AND pr.reference_url != ''
  AND (pr.created_by IS NULL OR p.badge_type = 'Trusted Voice')

UNION ALL

-- Sources from Discussions
SELECT
  'Discussion' AS origin_type,
  d.id AS origin_id,
  d.slug AS origin_slug,
  d.title AS title,
  d.reference_url AS reference_url,
  d.created_at AS created_at,
  p.id AS author_id,
  p.full_name AS author_name,
  p.username AS author_username
FROM discussions d
LEFT JOIN profiles p ON d.author_id = p.id
WHERE d.reference_url IS NOT NULL
  AND d.reference_url != ''
  AND p.badge_type = 'Trusted Voice'
  AND COALESCE(d.is_flagged, false) = false

ORDER BY created_at DESC;

-- Add comment
COMMENT ON VIEW resource_library IS 'Evidence Vault: All reference URLs from Trusted Voice contributors';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to create
-- the resource library view for the Evidence Vault.
-- 
-- Note: If protocols table doesn't have 'created_by' or 'is_flagged' columns,
-- you may need to adjust the query accordingly.
-- =====================================================

