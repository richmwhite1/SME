-- =====================================================
-- BRAND MANAGEMENT INFRASTRUCTURE - DATABASE SCHEMA
-- =====================================================
-- Creates tables and updates for brand verification,
-- SME certification, and metered billing
-- =====================================================

-- =====================================================
-- 1. UPDATE PROFILES TABLE - Add Role Column
-- =====================================================
DO $$ 
BEGIN
    -- Create role enum type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('USER', 'BRAND_REP', 'SME', 'ADMIN');
    END IF;
END $$;

-- Add role column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'USER';

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON COLUMN profiles.role IS 'User role: USER (default), BRAND_REP (verified brand representative), SME (subject matter expert), ADMIN';

-- =====================================================
-- 2. UPDATE PRODUCTS TABLE - Add Brand Fields
-- =====================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand_owner_id TEXT REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS visit_count INTEGER DEFAULT 0;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_brand_owner ON products(brand_owner_id);
CREATE INDEX IF NOT EXISTS idx_products_is_verified ON products(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_products_visit_count ON products(visit_count DESC);

COMMENT ON COLUMN products.brand_owner_id IS 'Reference to the brand representative who owns this product';
COMMENT ON COLUMN products.is_verified IS 'Whether the brand has been verified (enables Buy It Now button)';
COMMENT ON COLUMN products.discount_code IS 'Optional discount code for verified brands';
COMMENT ON COLUMN products.visit_count IS 'Total view count for metered billing';

-- =====================================================
-- 3. BRAND VERIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS brand_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  work_email TEXT NOT NULL,
  linkedin_profile TEXT NOT NULL,
  company_website TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete')),
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_brand_verifications_status ON brand_verifications(status);
CREATE INDEX IF NOT EXISTS idx_brand_verifications_user_id ON brand_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_verifications_product_id ON brand_verifications(product_id);
CREATE INDEX IF NOT EXISTS idx_brand_verifications_created_at ON brand_verifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_brand_verifications_stripe_customer ON brand_verifications(stripe_customer_id);

-- Disable RLS
ALTER TABLE brand_verifications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE brand_verifications IS 'Brand verification applications with Stripe subscription tracking';
COMMENT ON COLUMN brand_verifications.status IS 'Verification status: pending, approved, rejected';
COMMENT ON COLUMN brand_verifications.stripe_subscription_id IS 'Stripe subscription ID for $100/month base subscription';
COMMENT ON COLUMN brand_verifications.subscription_status IS 'Current Stripe subscription status';

-- =====================================================
-- 4. SME CERTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sme_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  brand_owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lab_report_urls TEXT[] DEFAULT '{}',
  purity_data_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'more_info_needed')),
  stripe_payment_intent_id TEXT,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount INTEGER DEFAULT 300000, -- $3,000 in cents
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sme_certifications_status ON sme_certifications(status);
CREATE INDEX IF NOT EXISTS idx_sme_certifications_product_id ON sme_certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_sme_certifications_brand_owner ON sme_certifications(brand_owner_id);
CREATE INDEX IF NOT EXISTS idx_sme_certifications_payment_status ON sme_certifications(payment_status);
CREATE INDEX IF NOT EXISTS idx_sme_certifications_created_at ON sme_certifications(created_at DESC);

-- Disable RLS
ALTER TABLE sme_certifications DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE sme_certifications IS 'SME certification applications with document uploads and payment tracking';
COMMENT ON COLUMN sme_certifications.lab_report_urls IS 'Array of URLs to uploaded lab report documents';
COMMENT ON COLUMN sme_certifications.purity_data_urls IS 'Array of URLs to uploaded purity test documents';
COMMENT ON COLUMN sme_certifications.payment_amount IS 'Payment amount in cents (default $3,000)';

-- =====================================================
-- 5. PRODUCT VIEW METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_view_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  brand_owner_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  view_date DATE NOT NULL,
  view_count INTEGER DEFAULT 0,
  synced_to_stripe BOOLEAN DEFAULT false,
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per product per day
  CONSTRAINT unique_product_date UNIQUE (product_id, view_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_view_metrics_product_id ON product_view_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_view_metrics_brand_owner ON product_view_metrics(brand_owner_id);
CREATE INDEX IF NOT EXISTS idx_product_view_metrics_view_date ON product_view_metrics(view_date DESC);
CREATE INDEX IF NOT EXISTS idx_product_view_metrics_synced ON product_view_metrics(synced_to_stripe) WHERE synced_to_stripe = false;

-- Disable RLS
ALTER TABLE product_view_metrics DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_view_metrics IS 'Daily product view counts for metered billing';
COMMENT ON COLUMN product_view_metrics.synced_to_stripe IS 'Whether this metric has been reported to Stripe';

-- =====================================================
-- 6. STRIPE SUBSCRIPTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  subscription_type TEXT NOT NULL CHECK (subscription_type IN ('brand_base', 'metered_billing')),
  status TEXT NOT NULL CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_id ON stripe_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_customer_id ON stripe_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);

-- Disable RLS
ALTER TABLE stripe_subscriptions DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE stripe_subscriptions IS 'Stripe subscription tracking for brand management';
COMMENT ON COLUMN stripe_subscriptions.subscription_type IS 'Type: brand_base ($100/month) or metered_billing (per view)';

-- =====================================================
-- 7. FUNCTIONS
-- =====================================================

-- Function: Increment product view count
CREATE OR REPLACE FUNCTION increment_product_view(
  p_product_id UUID,
  p_brand_owner_id TEXT
)
RETURNS void AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Increment total visit count on product
  UPDATE products
  SET visit_count = visit_count + 1
  WHERE id = p_product_id;
  
  -- Insert or update daily metrics
  INSERT INTO product_view_metrics (product_id, brand_owner_id, view_date, view_count)
  VALUES (p_product_id, p_brand_owner_id, v_today, 1)
  ON CONFLICT (product_id, view_date)
  DO UPDATE SET 
    view_count = product_view_metrics.view_count + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_product_view IS 'Atomically increment product view count and daily metrics';

-- Function: Get pending brand verifications
CREATE OR REPLACE FUNCTION get_pending_brand_verifications()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_title TEXT,
  product_slug TEXT,
  user_id TEXT,
  user_name TEXT,
  user_email TEXT,
  work_email TEXT,
  linkedin_profile TEXT,
  company_website TEXT,
  subscription_status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bv.id,
    bv.product_id,
    pr.title AS product_title,
    pr.slug AS product_slug,
    bv.user_id,
    p.full_name AS user_name,
    p.email AS user_email,
    bv.work_email,
    bv.linkedin_profile,
    bv.company_website,
    bv.subscription_status,
    bv.created_at
  FROM brand_verifications bv
  JOIN products pr ON bv.product_id = pr.id
  JOIN profiles p ON bv.user_id = p.id
  WHERE bv.status = 'pending'
  ORDER BY bv.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_brand_verifications IS 'Get all pending brand verification applications';

-- Function: Get pending SME certifications
CREATE OR REPLACE FUNCTION get_pending_sme_certifications()
RETURNS TABLE (
  id UUID,
  product_id UUID,
  product_title TEXT,
  product_slug TEXT,
  brand_owner_id TEXT,
  brand_owner_name TEXT,
  lab_report_urls TEXT[],
  purity_data_urls TEXT[],
  payment_status TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.product_id,
    pr.title AS product_title,
    pr.slug AS product_slug,
    sc.brand_owner_id,
    p.full_name AS brand_owner_name,
    sc.lab_report_urls,
    sc.purity_data_urls,
    sc.payment_status,
    sc.status,
    sc.created_at
  FROM sme_certifications sc
  JOIN products pr ON sc.product_id = pr.id
  JOIN profiles p ON sc.brand_owner_id = p.id
  WHERE sc.status IN ('pending', 'under_review', 'more_info_needed')
    AND sc.payment_status = 'paid'
  ORDER BY sc.created_at ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_pending_sme_certifications IS 'Get all pending SME certification applications (paid only)';

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Trigger: Update brand_verifications updated_at
DROP TRIGGER IF EXISTS trigger_update_brand_verifications_updated_at ON brand_verifications;
CREATE TRIGGER trigger_update_brand_verifications_updated_at
  BEFORE UPDATE ON brand_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update sme_certifications updated_at
DROP TRIGGER IF EXISTS trigger_update_sme_certifications_updated_at ON sme_certifications;
CREATE TRIGGER trigger_update_sme_certifications_updated_at
  BEFORE UPDATE ON sme_certifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update product_view_metrics updated_at
DROP TRIGGER IF EXISTS trigger_update_product_view_metrics_updated_at ON product_view_metrics;
CREATE TRIGGER trigger_update_product_view_metrics_updated_at
  BEFORE UPDATE ON product_view_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update stripe_subscriptions updated_at
DROP TRIGGER IF EXISTS trigger_update_stripe_subscriptions_updated_at ON stripe_subscriptions;
CREATE TRIGGER trigger_update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCHEMA COMPLETE
-- =====================================================
-- Brand management infrastructure is ready
-- Run this migration to enable brand verification,
-- SME certification, and metered billing features
-- =====================================================
