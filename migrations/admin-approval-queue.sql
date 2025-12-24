-- =====================================================
-- ADMIN APPROVAL QUEUE SETUP
-- =====================================================
-- This migration adds columns and creates a view for the admin approval dashboard

-- Add certification_tier column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS certification_tier TEXT DEFAULT 'None' CHECK (certification_tier IN ('None', 'Bronze', 'Silver', 'Gold'));

-- Add admin_notes column for internal admin notes
ALTER TABLE products ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Create index for certification_tier
CREATE INDEX IF NOT EXISTS idx_products_certification_tier ON products(certification_tier);

-- =====================================================
-- ADMIN APPROVAL QUEUE VIEW
-- =====================================================
-- This view aggregates product data with signal counts for the admin dashboard

-- Drop existing view if it exists
DROP VIEW IF EXISTS admin_approval_queue;

CREATE VIEW admin_approval_queue AS
SELECT 
  p.id,
  p.title AS product_name,
  COALESCE(p.brand, 'Unknown Brand') AS brand,
  p.slug,
  COALESCE(p.admin_status, 'pending_review') AS admin_status,
  COALESCE(p.certification_tier, 'None') AS certification_tier,
  p.admin_notes,
  p.created_at,
  
  -- Count total truth signals (all verification flags that are true)
  (
    CASE WHEN p.third_party_lab_verified THEN 1 ELSE 0 END +
    CASE WHEN p.purity_tested THEN 1 ELSE 0 END +
    CASE WHEN p.source_transparency THEN 1 ELSE 0 END +
    CASE WHEN p.potency_verified THEN 1 ELSE 0 END +
    CASE WHEN p.excipient_audit THEN 1 ELSE 0 END +
    CASE WHEN p.operational_legitimacy THEN 1 ELSE 0 END
  ) AS total_signals,
  
  -- Count red flags (verification flags that are false)
  (
    CASE WHEN NOT COALESCE(p.third_party_lab_verified, false) THEN 1 ELSE 0 END +
    CASE WHEN NOT COALESCE(p.purity_tested, false) THEN 1 ELSE 0 END +
    CASE WHEN NOT COALESCE(p.source_transparency, false) THEN 1 ELSE 0 END +
    CASE WHEN NOT COALESCE(p.potency_verified, false) THEN 1 ELSE 0 END +
    CASE WHEN NOT COALESCE(p.excipient_audit, false) THEN 1 ELSE 0 END +
    CASE WHEN NOT COALESCE(p.operational_legitimacy, false) THEN 1 ELSE 0 END
  ) AS red_flags,
  
  -- Individual verification flags for detailed review
  p.third_party_lab_verified,
  p.purity_tested,
  p.source_transparency,
  p.potency_verified,
  p.excipient_audit,
  p.operational_legitimacy,
  
  p.coa_url,
  p.is_sme_certified

FROM products p
ORDER BY p.created_at DESC;

COMMENT ON VIEW admin_approval_queue IS 'Admin dashboard view showing products with signal counts for approval workflow';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
