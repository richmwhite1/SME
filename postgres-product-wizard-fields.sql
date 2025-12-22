-- =====================================================
-- Product Wizard Fields for Protocols Table
-- =====================================================
-- Adds fields needed for Admin Product Wizard and SME Certification
-- =====================================================

-- Add AI Summary field (Expert Notebook writeup)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Add buy URL and discount code
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS buy_url TEXT;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- Add verification checklist fields
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS lab_tested BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS purity_verified BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS third_party_coa BOOLEAN DEFAULT false;

-- Add certification notes (due diligence report)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS certification_notes TEXT;

-- Add lab PDF reference URL
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS lab_pdf_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocols_lab_tested ON protocols(lab_tested) WHERE lab_tested = true;
CREATE INDEX IF NOT EXISTS idx_protocols_organic ON protocols(organic) WHERE organic = true;
CREATE INDEX IF NOT EXISTS idx_protocols_purity_verified ON protocols(purity_verified) WHERE purity_verified = true;
CREATE INDEX IF NOT EXISTS idx_protocols_third_party_coa ON protocols(third_party_coa) WHERE third_party_coa = true;

-- Add comments
COMMENT ON COLUMN protocols.ai_summary IS 'AI-generated Expert Notebook writeup/summary';
COMMENT ON COLUMN protocols.buy_url IS 'Direct purchase URL for the product';
COMMENT ON COLUMN protocols.discount_code IS 'Discount code for the product';
COMMENT ON COLUMN protocols.lab_tested IS 'Whether the product has been lab tested';
COMMENT ON COLUMN protocols.organic IS 'Whether the product is organic certified';
COMMENT ON COLUMN protocols.purity_verified IS 'Whether product purity has been verified';
COMMENT ON COLUMN protocols.third_party_coa IS 'Whether product has third-party Certificate of Analysis';
COMMENT ON COLUMN protocols.certification_notes IS 'SME certification notes and due diligence report';
COMMENT ON COLUMN protocols.lab_pdf_url IS 'URL to raw lab PDF document';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- the necessary fields for the Admin Product Wizard.
-- =====================================================




