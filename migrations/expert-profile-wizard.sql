-- =====================================================
-- EXPERT PROFILE WIZARD MIGRATION
-- =====================================================
-- Adds expertise_lineage column to sme_applications
-- for storing user's experience/background narrative
-- =====================================================

-- Add expertise_lineage column to sme_applications table
ALTER TABLE sme_applications 
ADD COLUMN IF NOT EXISTS expertise_lineage TEXT;

-- Add comment
COMMENT ON COLUMN sme_applications.expertise_lineage IS 'User''s experience, background, and lineage in their field of expertise';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
