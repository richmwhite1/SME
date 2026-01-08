-- =====================================================
-- Citation Screening Migration
-- =====================================================
-- Adds citation_screened_ok field to support automated
-- citation validation and reduce SME verification bottleneck
-- =====================================================

-- Step 1: Add citation_screened_ok to product_comments
ALTER TABLE product_comments
  ADD COLUMN IF NOT EXISTS citation_screened_ok BOOLEAN DEFAULT false;

-- Step 2: Create index for efficient filtering of pre-screened citations
CREATE INDEX IF NOT EXISTS idx_product_comments_citation_screened 
  ON product_comments(citation_screened_ok) 
  WHERE citation_screened_ok = true;

-- Step 3: Add column comment for documentation
COMMENT ON COLUMN product_comments.citation_screened_ok IS 'Indicates if the citation has passed automated format and domain validation. True if citation is a valid URL/DOI from an approved academic/medical source.';

-- =====================================================
-- COMPLETE
-- =====================================================
-- Run this SQL to add citation screening support
-- =====================================================
