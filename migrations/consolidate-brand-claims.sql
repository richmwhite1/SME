-- =====================================================
-- CONSOLIDATE BRAND CLAIM ARCHITECTURE
-- =====================================================
-- Adds Stripe and brand claim fields to product_onboarding
-- to consolidate brand_verifications functionality
-- =====================================================

-- Add Stripe integration fields
ALTER TABLE product_onboarding 
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'incomplete')),
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ;

-- Create indexes for Stripe fields
CREATE INDEX IF NOT EXISTS idx_product_onboarding_stripe_subscription ON product_onboarding(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_stripe_customer ON product_onboarding(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_subscription_status ON product_onboarding(subscription_status);

-- Add comments
COMMENT ON COLUMN product_onboarding.stripe_subscription_id IS 'Stripe subscription ID for brand verification payments';
COMMENT ON COLUMN product_onboarding.stripe_customer_id IS 'Stripe customer ID for the user';
COMMENT ON COLUMN product_onboarding.subscription_status IS 'Current Stripe subscription status for brand claims';
COMMENT ON COLUMN product_onboarding.payment_link_sent_at IS 'Timestamp when payment link was sent to user';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
