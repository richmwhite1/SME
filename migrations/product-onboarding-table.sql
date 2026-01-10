-- =====================================================
-- PRODUCT ONBOARDING TABLE - Brand Claims & Product Edits
-- =====================================================
-- Stores pending brand claims and product edit submissions
-- for admin review and approval workflow
-- =====================================================

CREATE TABLE IF NOT EXISTS product_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('brand_claim', 'product_edit')),
  proposed_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  current_data JSONB DEFAULT '{}'::jsonb,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  reviewed_by TEXT REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_onboarding_verification_status ON product_onboarding(verification_status);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_user_id ON product_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_product_id ON product_onboarding(product_id);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_created_at ON product_onboarding(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_onboarding_submission_type ON product_onboarding(submission_type);

-- Disable RLS for Clerk integration
ALTER TABLE product_onboarding DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE product_onboarding IS 'Pending brand claims and product edits awaiting admin review';
COMMENT ON COLUMN product_onboarding.submission_type IS 'Type of submission: brand_claim or product_edit';
COMMENT ON COLUMN product_onboarding.proposed_data IS 'JSONB object containing all proposed changes';
COMMENT ON COLUMN product_onboarding.current_data IS 'JSONB snapshot of current product data for comparison';
COMMENT ON COLUMN product_onboarding.verification_status IS 'Review status: pending, verified, rejected';

-- Trigger: Update product_onboarding updated_at
DROP TRIGGER IF EXISTS trigger_update_product_onboarding_updated_at ON product_onboarding;
CREATE TRIGGER trigger_update_product_onboarding_updated_at
  BEFORE UPDATE ON product_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
