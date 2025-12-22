-- =====================================================
-- Add 5 Pillars Certification Fields
-- =====================================================
-- Adds the remaining 3 pillars (Potency, Excipient Audit, Operational Legitimacy)
-- to complete the 5 Pillars system:
-- 1. Source Transparency (already exists)
-- 2. Purity (already exists as purity_tested)
-- 3. Potency (new)
-- 4. Excipient Audit (new)
-- 5. Operational Legitimacy (new)
-- =====================================================

-- Add Potency Verified field
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS potency_verified BOOLEAN DEFAULT false;

-- Add Excipient Audit field
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS excipient_audit BOOLEAN DEFAULT false;

-- Add Operational Legitimacy field
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS operational_legitimacy BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_protocols_potency_verified ON protocols(potency_verified) WHERE potency_verified = true;
CREATE INDEX IF NOT EXISTS idx_protocols_excipient_audit ON protocols(excipient_audit) WHERE excipient_audit = true;
CREATE INDEX IF NOT EXISTS idx_protocols_operational_legitimacy ON protocols(operational_legitimacy) WHERE operational_legitimacy = true;

-- Add comments
COMMENT ON COLUMN protocols.potency_verified IS 'Potency - Product potency has been tested and verified';
COMMENT ON COLUMN protocols.excipient_audit IS 'Excipient Audit - Non-active ingredients have been audited and verified';
COMMENT ON COLUMN protocols.operational_legitimacy IS 'Operational Legitimacy - Manufacturer operations and legitimacy verified';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL in Supabase SQL Editor to add
-- the remaining 3 pillars for the 5 Pillars certification system.
-- =====================================================





