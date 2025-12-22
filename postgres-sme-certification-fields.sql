-- =====================================================
-- SME Certification Fields for Protocols Table
-- =====================================================
-- Adds fields needed for SME Certification and Product Onboarding
-- =====================================================

-- Add SME certification flag
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS is_sme_certified BOOLEAN DEFAULT false;

-- Add SME-specific verification fields (5-Pillar Framework)
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS third_party_lab_verified BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS purity_tested BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS source_transparency BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS potency_verified BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS excipient_audit BOOLEAN DEFAULT false;
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS operational_legitimacy BOOLEAN DEFAULT false;

-- Add COA (Certificate of Analysis) URL
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS coa_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocols_is_sme_certified ON protocols(is_sme_certified) WHERE is_sme_certified = true;
CREATE INDEX IF NOT EXISTS idx_protocols_third_party_lab_verified ON protocols(third_party_lab_verified) WHERE third_party_lab_verified = true;
CREATE INDEX IF NOT EXISTS idx_protocols_purity_tested ON protocols(purity_tested) WHERE purity_tested = true;
CREATE INDEX IF NOT EXISTS idx_protocols_source_transparency ON protocols(source_transparency) WHERE source_transparency = true;
CREATE INDEX IF NOT EXISTS idx_protocols_potency_verified ON protocols(potency_verified) WHERE potency_verified = true;
CREATE INDEX IF NOT EXISTS idx_protocols_excipient_audit ON protocols(excipient_audit) WHERE excipient_audit = true;
CREATE INDEX IF NOT EXISTS idx_protocols_operational_legitimacy ON protocols(operational_legitimacy) WHERE operational_legitimacy = true;

-- Add comments
COMMENT ON COLUMN protocols.is_sme_certified IS 'Whether the product is SME certified (meets all 3 verification criteria)';
COMMENT ON COLUMN protocols.third_party_lab_verified IS '3rd Party Lab Verified - Product has been verified by independent lab';
COMMENT ON COLUMN protocols.purity_tested IS 'Purity Tested - Product purity has been tested and verified (Pillar 2)';
COMMENT ON COLUMN protocols.source_transparency IS 'Source Transparency - Product source and supply chain are transparent (Pillar 1)';
COMMENT ON COLUMN protocols.potency_verified IS 'Potency Verified - Active ingredient concentrations verified (Pillar 3)';
COMMENT ON COLUMN protocols.excipient_audit IS 'Excipient Audit - Non-active ingredients assessed for safety (Pillar 4)';
COMMENT ON COLUMN protocols.operational_legitimacy IS 'Operational Legitimacy - Business practices and regulatory compliance verified (Pillar 5)';
COMMENT ON COLUMN protocols.coa_url IS 'Certificate of Analysis (COA) document URL';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- the necessary fields for SME Certification.
-- =====================================================




