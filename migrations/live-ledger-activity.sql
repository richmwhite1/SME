-- =====================================================
-- LIVE LEDGER ACTIVITY VIEW
-- =====================================================
-- Creates a unified view of community activity for the LiveLedger component
-- Aggregates signal verifications, promotions, and certifications

-- Drop existing view if it exists
DROP VIEW IF EXISTS live_ledger_activity;

-- Create the live_ledger_activity view
CREATE OR REPLACE VIEW live_ledger_activity AS

-- 1. PROMOTION ACTIVITY: Users promoted to SME via vouching
SELECT 
  'promotion' AS activity_type,
  COALESCE(voucher.display_name, voucher.full_name, voucher.username, 'Anonymous') AS actor_name,
  COALESCE(target.display_name, target.full_name, target.username, 'Anonymous') AS target_name,
  'SME Status' AS detail,
  v.created_at
FROM vouches v
JOIN profiles voucher ON v.voucher_id = voucher.id
JOIN profiles target ON v.target_user_id = target.id
WHERE target.reputation_tier >= 3  -- Only show successful promotions

UNION ALL

-- 2. CERTIFICATION ACTIVITY: Admin approvals of SME applications
SELECT 
  'certification' AS activity_type,
  'Admin' AS actor_name,
  COALESCE(p.display_name, p.full_name, p.username, 'Anonymous') AS target_name,
  CASE 
    WHEN app.expertise_lens = 'Scientific' THEN '🧬 Scientific Expert'
    WHEN app.expertise_lens = 'Alternative' THEN '🪵 Alternative Expert'
    WHEN app.expertise_lens = 'Esoteric' THEN '👁️ Esoteric Expert'
    ELSE 'Expert'
  END AS detail,
  app.reviewed_at AS created_at
FROM sme_applications app
JOIN profiles p ON app.user_id = p.id
WHERE app.status = 'approved' AND app.reviewed_at IS NOT NULL

UNION ALL

-- 3. SIGNAL ACTIVITY: Products receiving certification tiers
-- (Using product approval as a proxy for signal verification)
SELECT 
  'signal' AS activity_type,
  'Community' AS actor_name,
  p.title AS target_name,
  CASE 
    WHEN p.certification_tier = 'Gold' THEN '🏆 Gold'
    WHEN p.certification_tier = 'Silver' THEN '🥈 Silver'
    WHEN p.certification_tier = 'Bronze' THEN '🥉 Bronze'
    ELSE '✓ Verified'
  END AS detail,
  p.updated_at AS created_at
FROM products p
WHERE p.certification_tier IS NOT NULL 
  AND p.certification_tier != 'None'
  AND p.admin_status = 'approved'

-- Order by most recent first
ORDER BY created_at DESC
LIMIT 50;

COMMENT ON VIEW live_ledger_activity IS 'Unified activity feed showing promotions, certifications, and signal verifications for the LiveLedger component';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
