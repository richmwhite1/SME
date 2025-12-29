-- =====================================================
-- 9-PILLAR SME REVIEW SYSTEM MIGRATION
-- =====================================================
-- Adds SME review functionality with 9 pillars:
-- Purity, Bioavailability, Potency, Evidence, Sustainability,
-- Experience, Safety, Transparency, Synergy
-- =====================================================

-- 1. Add is_sme column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_sme BOOLEAN DEFAULT false;

-- Create index for SME users
CREATE INDEX IF NOT EXISTS idx_profiles_is_sme 
ON profiles(is_sme) 
WHERE is_sme = true;

COMMENT ON COLUMN profiles.is_sme IS 'Whether the user is a Subject Matter Expert (SME) with review privileges';

-- 2. Create sme_reviews table
CREATE TABLE IF NOT EXISTS sme_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sme_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- 9 Pillar Scores (0-10 scale, NULL = N/A)
  purity INTEGER CHECK (purity IS NULL OR (purity >= 0 AND purity <= 10)),
  bioavailability INTEGER CHECK (bioavailability IS NULL OR (bioavailability >= 0 AND bioavailability <= 10)),
  potency INTEGER CHECK (potency IS NULL OR (potency >= 0 AND potency <= 10)),
  evidence INTEGER CHECK (evidence IS NULL OR (evidence >= 0 AND evidence <= 10)),
  sustainability INTEGER CHECK (sustainability IS NULL OR (sustainability >= 0 AND sustainability <= 10)),
  experience INTEGER CHECK (experience IS NULL OR (experience >= 0 AND experience <= 10)),
  safety INTEGER CHECK (safety IS NULL OR (safety >= 0 AND safety <= 10)),
  transparency INTEGER CHECK (transparency IS NULL OR (transparency >= 0 AND transparency <= 10)),
  synergy INTEGER CHECK (synergy IS NULL OR (synergy >= 0 AND synergy <= 10)),
  
  -- Expert Summary
  expert_summary TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Each SME can only review a product once
  CONSTRAINT unique_sme_product_review UNIQUE (sme_id, product_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sme_reviews_product_id ON sme_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_sme_reviews_sme_id ON sme_reviews(sme_id);
CREATE INDEX IF NOT EXISTS idx_sme_reviews_created_at ON sme_reviews(created_at DESC);

-- Disable RLS
ALTER TABLE sme_reviews DISABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE sme_reviews IS 'SME (Subject Matter Expert) reviews with 9-pillar scoring system';
COMMENT ON COLUMN sme_reviews.purity IS 'Purity score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.bioavailability IS 'Bioavailability score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.potency IS 'Potency score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.evidence IS 'Evidence score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.sustainability IS 'Sustainability score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.experience IS 'Experience score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.safety IS 'Safety score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.transparency IS 'Transparency score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.synergy IS 'Synergy score (0-10, NULL = N/A)';
COMMENT ON COLUMN sme_reviews.expert_summary IS 'Expert summary and notes from the SME';

-- 3. Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_sme_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sme_reviews_updated_at ON sme_reviews;
CREATE TRIGGER trigger_update_sme_reviews_updated_at
  BEFORE UPDATE ON sme_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_sme_reviews_updated_at();

-- 4. Add columns to products table for average SME scores
ALTER TABLE products
ADD COLUMN IF NOT EXISTS avg_sme_purity DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_bioavailability DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_potency DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_evidence DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_sustainability DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_experience DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_safety DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_transparency DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avg_sme_synergy DECIMAL(3,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sme_review_count INTEGER DEFAULT 0;

-- Create indexes for average scores
CREATE INDEX IF NOT EXISTS idx_products_avg_sme_purity ON products(avg_sme_purity DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_sme_review_count ON products(sme_review_count DESC);

-- Add comments
COMMENT ON COLUMN products.avg_sme_purity IS 'Average SME purity score across all reviews';
COMMENT ON COLUMN products.avg_sme_bioavailability IS 'Average SME bioavailability score across all reviews';
COMMENT ON COLUMN products.avg_sme_potency IS 'Average SME potency score across all reviews';
COMMENT ON COLUMN products.avg_sme_evidence IS 'Average SME evidence score across all reviews';
COMMENT ON COLUMN products.avg_sme_sustainability IS 'Average SME sustainability score across all reviews';
COMMENT ON COLUMN products.avg_sme_experience IS 'Average SME experience score across all reviews';
COMMENT ON COLUMN products.avg_sme_safety IS 'Average SME safety score across all reviews';
COMMENT ON COLUMN products.avg_sme_transparency IS 'Average SME transparency score across all reviews';
COMMENT ON COLUMN products.avg_sme_synergy IS 'Average SME synergy score across all reviews';
COMMENT ON COLUMN products.sme_review_count IS 'Total number of SME reviews for this product';

-- 5. Function to calculate and update average SME scores
CREATE OR REPLACE FUNCTION update_product_sme_averages()
RETURNS TRIGGER AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Determine which product to update
  IF TG_OP = 'DELETE' THEN
    v_product_id := OLD.product_id;
  ELSE
    v_product_id := NEW.product_id;
  END IF;

  -- Update product averages
  UPDATE products
  SET
    avg_sme_purity = (
      SELECT AVG(purity)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND purity IS NOT NULL
    ),
    avg_sme_bioavailability = (
      SELECT AVG(bioavailability)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND bioavailability IS NOT NULL
    ),
    avg_sme_potency = (
      SELECT AVG(potency)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND potency IS NOT NULL
    ),
    avg_sme_evidence = (
      SELECT AVG(evidence)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND evidence IS NOT NULL
    ),
    avg_sme_sustainability = (
      SELECT AVG(sustainability)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND sustainability IS NOT NULL
    ),
    avg_sme_experience = (
      SELECT AVG(experience)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND experience IS NOT NULL
    ),
    avg_sme_safety = (
      SELECT AVG(safety)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND safety IS NOT NULL
    ),
    avg_sme_transparency = (
      SELECT AVG(transparency)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND transparency IS NOT NULL
    ),
    avg_sme_synergy = (
      SELECT AVG(synergy)::DECIMAL(3,1)
      FROM sme_reviews
      WHERE product_id = v_product_id AND synergy IS NOT NULL
    ),
    sme_review_count = (
      SELECT COUNT(*)::INTEGER
      FROM sme_reviews
      WHERE product_id = v_product_id
    )
  WHERE id = v_product_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update averages on insert/update/delete
DROP TRIGGER IF EXISTS trigger_update_product_sme_averages ON sme_reviews;
CREATE TRIGGER trigger_update_product_sme_averages
  AFTER INSERT OR UPDATE OR DELETE ON sme_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_sme_averages();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
