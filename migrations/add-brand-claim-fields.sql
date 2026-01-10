-- =====================================================
-- ADD BRAND CLAIM FIELDS MIGRATION
-- =====================================================
-- Adds new fields to brand_verifications table for
-- enhanced brand claiming wizard
-- =====================================================

-- Add new columns to brand_verifications table
ALTER TABLE brand_verifications 
  ADD COLUMN IF NOT EXISTS founder_comments TEXT,
  ADD COLUMN IF NOT EXISTS intention_statement TEXT,
  ADD COLUMN IF NOT EXISTS lab_report_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_link_sent_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN brand_verifications.founder_comments IS 'Optional comments from the founder about the product';
COMMENT ON COLUMN brand_verifications.intention_statement IS 'Required statement about brand intention and mission';
COMMENT ON COLUMN brand_verifications.lab_report_url IS 'Optional URL to lab report documentation';
COMMENT ON COLUMN brand_verifications.payment_link_sent_at IS 'Timestamp when payment link was sent to user after admin approval';

-- Create index for payment tracking
CREATE INDEX IF NOT EXISTS idx_brand_verifications_payment_sent ON brand_verifications(payment_link_sent_at) WHERE payment_link_sent_at IS NOT NULL;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
